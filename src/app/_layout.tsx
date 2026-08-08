import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AuthProvider, useSession } from '@/auth/AuthProvider';
import { db, initDb } from '@/db/client';
import { useReconcileOnLogin } from '@/db/use-reconcile';
import { CuentaScreen } from '@/ui/CuentaScreen';
import { Loading } from '@/ui/Loading';
import { ThemeProvider as AppThemeProvider } from '@/ui/theme';
import { WelcomeScreen } from '@/ui/WelcomeScreen';
import migrations from '../../drizzle/migrations';

/**
 * Abre la base de datos antes de nada. En nativo es inmediato; en web hay que esperar a
 * que arranque el worker de SQLite (ver `db/client.web.ts`), y hasta entonces no se
 * puede tocar `db` — de ahí que las migraciones vivan en otro componente.
 */
export default function RootLayout() {
  const [state, setState] = useState<{ ready: boolean; error: Error | null }>({
    ready: false,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    initDb().then(
      () => alive && setState({ ready: true, error: null }),
      (e: Error) => alive && setState({ ready: false, error: e }),
    );
    return () => {
      alive = false;
    };
  }, []);

  if (state.error) return <DbError message={state.error.message} />;
  if (!state.ready) return <DbLoading />;
  return <Migrations />;
}

function Migrations() {
  const { success, error } = useMigrations(db, migrations);

  if (error) return <DbError message={error.message} />;
  if (!success) return <DbLoading />;

  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootGate />
      </AuthProvider>
    </AppThemeProvider>
  );
}

function DbLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  );
}

function DbError({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text>Error preparando la base de datos: {message}</Text>
    </View>
  );
}

/**
 * Puerta de entrada: sin sesión muestra el login (obligatorio); con sesión, la app.
 * La sesión se persiste, así que una vez dentro no vuelve a pedir login.
 */
function RootGate() {
  const colorScheme = useColorScheme();
  const { session, loading } = useSession();
  const reconciling = useReconcileOnLogin();

  // La bienvenida se desmonta cuando termina su propia animación (onFinish).
  const [welcomeDone, setWelcomeDone] = useState(false);

  let content;
  if (!welcomeDone) content = <WelcomeScreen onFinish={() => setWelcomeDone(true)} />;
  else if (loading) content = <Loading />;
  else if (!session) content = <CuentaScreen />;
  else if (reconciling) content = <Loading />; // restaurando tus datos tras iniciar sesión
  else content = <AppTabs />;

  return <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>{content}</NavThemeProvider>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
