import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { Brand } from '@/constants/theme';

/**
 * Pull-to-refresh reutilizable ("desliza hacia abajo para actualizar").
 * Devuelve un RefreshControl listo (el círculo girando hasta terminar) y un `nonce`
 * que cambia en cada tirón: pásalo como `reloadNonce` a las tarjetas que cargan sus
 * propios datos para que también se recarguen.
 */
export function useRefresh(reload: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setNonce((n) => n + 1);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const control = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Brand.accent}
      colors={[Brand.accent]}
      progressBackgroundColor={Brand.card}
    />
  );

  return { control, nonce };
}
