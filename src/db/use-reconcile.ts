import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/lib/alert';

import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/datetime';
import { getDataOwner, getLastSync, getRemoteMeta, localHasData, pullSnapshot, pushSnapshot, setDataOwner } from './cloud-sync';
import { reconcileDecision } from './cloud-sync-logic';
import { clearAllData } from './backup';

/**
 * Reconcilia los datos local/nube SOLO al iniciar sesión de verdad (evento SIGNED_IN),
 * no en cada arranque con sesión ya guardada (eso usaría los datos locales tal cual).
 * Devuelve `reconciling`: true mientras descarga/sube, para que la app espere y no
 * muestre el onboarding con la BD aún vacía.
 */
export function useReconcileOnLogin(): boolean {
  const [reconciling, setReconciling] = useState(false);
  const doneFor = useRef<Set<string>>(new Set());

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;
      // Sesión ya guardada al arrancar: los datos locales son de este usuario.
      // Rellena el propietario en instalaciones anteriores a la marca `data_owner`.
      if (event === 'INITIAL_SESSION' && userId) {
        (async () => {
          if ((await getDataOwner()) == null && (await localHasData())) await setDataOwner(userId);
        })();
        return;
      }
      if (event !== 'SIGNED_IN' || !userId || doneFor.current.has(userId)) return;
      doneFor.current.add(userId);
      setReconciling(true);
      (async () => {
        try {
          const [meta, hasLocal, lastSync, owner] = await Promise.all([getRemoteMeta(userId), localHasData(), getLastSync(), getDataOwner()]);
          const foreignOwner = owner != null && owner !== userId;
          const action = reconcileDecision({ localHasData: hasLocal, remoteExists: meta.exists, foreignOwner });
          if (action === 'replace') {
            // Los datos locales son de otra cuenta: no se adoptan ni se suben.
            await clearAllData();
            await pullSnapshot(userId);
            Alert.alert('Sincronizado', 'Este móvil guardaba los datos de otra cuenta (siguen a salvo en su nube). Hemos cargado los tuyos.');
          } else if (action === 'reset') {
            await clearAllData();
            await setDataOwner(userId);
            Alert.alert('Cuenta nueva', 'Este móvil guardaba los datos de otra cuenta (siguen a salvo en su nube). Tu cuenta empieza de cero.');
          } else if (action === 'pull') await pullSnapshot(userId);
          else if (action === 'push') await pushSnapshot(userId);
          else if (action === 'none') await setDataOwner(userId);
          else if (action === 'ask') {
            const cloudTxt = formatDateTime(meta.updatedAt);
            const localTxt = lastSync ? formatDateTime(lastSync) : 'nunca en este móvil';
            Alert.alert(
              'Sincronizar',
              `Tienes datos en este móvil y en tu cuenta. ¿Cuáles quieres conservar?\n\n☁️ Nube (última copia): ${cloudTxt}\n📱 Este móvil (última sinc.): ${localTxt}`,
              [
                { text: 'Usar los de la nube', onPress: () => { pullSnapshot(userId); } },
                { text: 'Subir los de este móvil', onPress: () => { pushSnapshot(userId); } },
              ],
              { cancelable: false },
            );
          }
        } catch {
          Alert.alert('Sincronización', 'No se pudo sincronizar ahora (¿sin conexión?). Tus datos siguen en el móvil.');
        } finally {
          setReconciling(false);
        }
      })();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return reconciling;
}
