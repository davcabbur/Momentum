import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/ui/theme';

/**
 * Barra de pestañas inferior: Inicio · Entreno · Progreso · Nutrición.
 * Ajustes y Glosario son rutas accesibles (engranaje en Inicio), no pestañas.
 */
export default function AppTabs() {
  const { c } = useTheme();
  return (
    <>
      <StatusBar style={c.scheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.textMuted,
          tabBarStyle: { backgroundColor: c.card, borderTopColor: c.cardBorder },
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="entreno"
        options={{
          title: 'Entreno',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutricion"
        options={{
          title: 'Nutrición',
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition-outline" size={size} color={color} />,
        }}
      />
      {/* Rutas fuera de la barra */}
      <Tabs.Screen name="ajustes" options={{ href: null }} />
      <Tabs.Screen name="glosario" options={{ href: null }} />
      <Tabs.Screen name="historial" options={{ href: null }} />
      </Tabs>
    </>
  );
}
