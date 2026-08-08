import { useEffect, useRef } from 'react';

import { useSession } from '@/auth/AuthProvider';
import { shouldAutoSync } from './auto-sync-logic';
import { getDataOwner, getLastSync, pushSnapshot } from './cloud-sync';

/**
 * Sube una copia a la nube al abrir la app, si la última tiene más de un día.
 *
 * Antes de esto, los datos solo subían cuando el usuario pulsaba el botón de sincronizar
 * en Ajustes. O sea que la copia de la nube estaba tan vieja como la última vez que se
 * acordó: perder el móvil era perder todo lo hecho desde entonces, y el otro dispositivo
 * solo veía hasta ahí.
 *
 * De paso resuelve algo que no era evidente: Supabase suspende los proyectos gratuitos
 * tras una semana sin peticiones, y esta app apenas hacía ninguna. La sesión queda
 * guardada, así que no se vuelve a hacer login, y todo lo demás es local — se podía
 * entrenar un mes entero sin que saliera una sola petición, y el proyecto se pausaba
 * aunque la app se estuviera usando a diario. Subiendo una copia al día eso no pasa.
 *
 * Ojo con lo que NO hace: no baja nunca. Bajar reemplaza la base de datos local y podría
 * borrar lo que se acaba de registrar. Elegir entre local y nube es del reconcile al
 * iniciar sesión, que sabe preguntar. Aquí solo se sube, y solo si los datos locales
 * constan como de esta cuenta.
 *
 * Es silencioso a propósito: si falla, no se avisa. Es una red de seguridad de fondo, y
 * un aviso de sincronización al abrir la app sería ruido — sobre todo con la regla de que
 * nada debe generar ansiedad. El botón de Ajustes sigue ahí para subir a mano y ver el
 * resultado.
 */
export function useAutoSync(reconciling: boolean): void {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;

  // Una vez por usuario y por arranque: sin esto, cualquier re-render volvería a mirar.
  const hecho = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || reconciling || hecho.current.has(userId)) return;

    let vivo = true;
    (async () => {
      try {
        const [dataOwner, lastSyncAt] = await Promise.all([getDataOwner(), getLastSync()]);
        if (!vivo) return;

        const toca = shouldAutoSync({
          hasSession: true,
          reconciling: false,
          dataOwner,
          userId,
          lastSyncAt,
          nowMs: Date.now(),
        });
        // La marca se pone al decidir, no al terminar: si falla, no se reintenta en bucle
        // en cada re-render de este arranque. El siguiente arranque lo volverá a intentar.
        hecho.current.add(userId);
        if (!toca) return;

        await pushSnapshot(userId);
      } catch {
        // Sin red, servidor en pausa o RLS quejándose: se calla y se reintenta en el
        // siguiente arranque. Los datos locales están intactos, que es lo que importa.
      }
    })();

    return () => {
      vivo = false;
    };
  }, [userId, reconciling]);
}
