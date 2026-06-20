import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

/** Indicador de carga centrado, para evitar pantallas en blanco mientras se lee la BD. */
export function Loading() {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.accent} />
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },
  });
