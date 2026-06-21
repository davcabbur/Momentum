import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AuthProvider, useSession } from '@/auth/AuthProvider';
import { db } from '@/db/client';
import { useReconcileOnLogin } from '@/db/use-reconcile';
import { CuentaScreen } from '@/ui/CuentaScreen';
import { Loading } from '@/ui/Loading';
import { ThemeProvider as AppThemeProvider } from '@/ui/theme';
import migrations from '../../drizzle/migrations';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error preparando la base de datos: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootGate />
      </AuthProvider>
    </AppThemeProvider>
  );
}

/**
 * Puerta de entrada: sin sesión muestra el login (obligatorio); con sesión, la app.
 * La sesión se persiste, así que una vez dentro no vuelve a pedir login.
 */
function RootGate() {
  const colorScheme = useColorScheme();
  const { session, loading } = useSession();
  useReconcileOnLogin(session?.user?.id ?? null);

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {loading ? <Loading /> : session ? <AppTabs /> : <CuentaScreen gate />}
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
