import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { getRemoteMeta, localHasData, pullSnapshot, pushSnapshot } from './cloud-sync';
import { reconcileDecision } from './cloud-sync-logic';

/**
 * Al iniciar sesión (cuando aparece userId), reconcilia los datos del móvil con los de
 * la cuenta una sola vez por usuario: sube, baja o pregunta según dónde haya datos.
 */
export function useReconcileOnLogin(userId: string | null): void {
  const doneFor = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || doneFor.current === userId) return;
    doneFor.current = userId;
    (async () => {
      try {
        const [meta, hasLocal] = await Promise.all([getRemoteMeta(userId), localHasData()]);
        const action = reconcileDecision({ localHasData: hasLocal, remoteExists: meta.exists });
        if (action === 'pull') await pullSnapshot(userId);
        else if (action === 'push') await pushSnapshot(userId);
        else if (action === 'ask') {
          Alert.alert('Sincronizar', 'Tienes datos en este móvil y en tu cuenta. ¿Cuáles quieres conservar?', [
            { text: 'Usar los de la nube', onPress: () => { pullSnapshot(userId); } },
            { text: 'Subir los de este móvil', onPress: () => { pushSnapshot(userId); } },
          ]);
        }
      } catch {
        Alert.alert('Sincronización', 'No se pudo sincronizar ahora (¿sin conexión?). Tus datos siguen en el móvil.');
      }
    })();
  }, [userId]);
}
