import { Tabs } from 'expo-router';

import { Brand } from '@/constants/theme';

/**
 * Barra de pestañas inferior. Por ahora solo "Hoy" (el seguimiento de peso).
 * Entreno · Progreso · Más se añadirán con sus respectivos milestones.
 */
export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.accent,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Hoy' }} />
      <Tabs.Screen name="entreno" options={{ title: 'Entreno' }} />
    </Tabs>
  );
}
