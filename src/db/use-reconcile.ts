import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';
import { getRemoteMeta, localHasData, pullSnapshot, pushSnapshot } from './cloud-sync';
import { reconcileDecision } from './cloud-sync-logic';

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
      if (event !== 'SIGNED_IN' || !userId || doneFor.current.has(userId)) return;
      doneFor.current.add(userId);
      setReconciling(true);
      (async () => {
        try {
          const [meta, hasLocal] = await Promise.all([getRemoteMeta(userId), localHasData()]);
          const action = reconcileDecision({ localHasData: hasLocal, remoteExists: meta.exists });
          if (action === 'pull') await pullSnapshot(userId);
          else if (action === 'push') await pushSnapshot(userId);
          else if (action === 'ask') {
            Alert.alert(
              'Sincronizar',
              'Tienes datos en este móvil y en tu cuenta. ¿Cuáles quieres conservar?',
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
