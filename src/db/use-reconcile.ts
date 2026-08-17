import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from '@/lib/alert';

import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/datetime';
import { getDataOwner, getLastSync, getRemoteMeta, localHasData, pullSnapshot, pushSnapshot, setDataOwner } from './cloud-sync';
import { reconcileDecision } from './cloud-sync-logic';
import { clearAllData } from './backup';

/**
 * Marca de "ya se reconcilió en este dispositivo para esta cuenta".
 *
 * Va en AsyncStorage y no en la BD por dos razones: `clearAllData()` borra la BD entera
 * (incluida la tabla de ajustes) justo en medio de algunas reconciliaciones, y esto tiene
 * que sobrevivir a eso.
 */
const RECONCILED_KEY = 'momentum.reconciled_for';

async function yaReconciliado(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RECONCILED_KEY)) === userId;
  } catch {
    return false;
  }
}

async function marcarReconciliado(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(RECONCILED_KEY, userId);
  } catch {
    /* Si falla, como mucho se vuelve a reconciliar; no se pierde nada. */
  }
}

/** Al cerrar sesión: el siguiente inicio vuelve a reconciliar. La llama `signOut()`. */
export async function olvidarReconciliado(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECONCILED_KEY);
  } catch {
    /* idem */
  }
}

/**
 * Reconcilia los datos local/nube SOLO al iniciar sesión de verdad, no en cada arranque.
 * Devuelve `reconciling`: true mientras descarga/sube, para que la app espere y no
 * muestre el onboarding con la BD aún vacía.
 *
 * Ojo con el "solo al iniciar sesión": supabase-js NO garantiza que `SIGNED_IN` llegue una
 * sola vez. Lo emite también al recuperar la sesión guardada, y su propia documentación
 * avisa de que puede repetirse. El `doneFor` de memoria no protege de eso, porque en web
 * cada recarga de la página lo pone a cero — y entonces la reconciliación se repetía en
 * CADA arranque. Con la pregunta de "¿cuáles quieres conservar?" respondida como "los de la
 * nube", eso significa reemplazar los datos locales por la copia de la nube una y otra vez:
 * lo que registrabas desaparecía al volver a abrir la app.
 *
 * De ahí la marca persistente: reconciliar es cosa de la PRIMERA vez que esta cuenta entra
 * en este dispositivo. Después, los datos locales mandan, y subirlos es tarea de
 * `use-auto-sync`. Al cerrar sesión la marca se borra, así que un login de verdad vuelve a
 * reconciliar.
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
          // Ya se hizo en este dispositivo para esta cuenta: no repetir, que repetir aquí
          // es reemplazar datos.
          if (await yaReconciliado(userId)) return;

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
          // Solo si ha ido bien. Si falla, sin marca, y se reintenta al siguiente arranque.
          await marcarReconciliado(userId);
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
