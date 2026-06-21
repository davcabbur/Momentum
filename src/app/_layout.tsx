import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/auth/AuthProvider';
import { db } from '@/db/client';
import { ThemeProvider as AppThemeProvider } from '@/ui/theme';
import migrations from '../../drizzle/migrations';

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
        <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppTabs />
        </NavThemeProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
