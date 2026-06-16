import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';

/** Indicador de carga centrado, para evitar pantallas en blanco mientras se lee la BD. */
export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Brand.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.surface },
});
