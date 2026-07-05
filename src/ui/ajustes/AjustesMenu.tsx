import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { useTheme } from '@/ui/theme';
import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

// Política de privacidad (página estática servida con GitHub Pages desde /docs).
const PRIVACY_URL = 'https://davcabbur.github.io/Momentum/privacy.html';

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; route?: string; url?: string };

export function AjustesMenu() {
  const { c } = useTheme();
  const styles = useAjustesStyles();
  const router = useRouter();
  const { user } = useSession();

  const items: Item[] = [
    { icon: 'person-outline', label: 'Perfil', route: '/ajustes/perfil' },
    { icon: 'flag-outline', label: 'Objetivo de peso', route: '/ajustes/objetivo' },
    { icon: 'barbell-outline', label: 'Nivel de entreno', route: '/ajustes/nivel' },
    ...(user ? [{ icon: 'person-circle-outline' as const, label: 'Cuenta', route: '/ajustes/cuenta' }] : []),
    { icon: 'color-palette-outline', label: 'Apariencia', route: '/ajustes/apariencia' },
    { icon: 'notifications-outline', label: 'Recordatorios', route: '/ajustes/recordatorios' },
    { icon: 'cloud-upload-outline', label: 'Copia de seguridad', route: '/ajustes/copia' },
    { icon: 'book-outline', label: 'Glosario de términos', route: '/glosario' },
    { icon: 'lock-closed-outline', label: 'Política de privacidad', url: PRIVACY_URL },
    { icon: 'information-circle-outline', label: 'Acerca de', route: '/ajustes/acerca' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Ajustes" />
      {items.map((it) => (
        <Pressable
          key={it.label}
          style={styles.menuRow}
          onPress={() => (it.url ? Linking.openURL(it.url) : router.push(it.route as Href))}>
          <Ionicons name={it.icon} size={20} color={c.accent} style={styles.menuIcon} />
          <Text style={styles.menuLabel}>{it.label}</Text>
          <Ionicons name={it.url ? 'open-outline' : 'chevron-forward'} size={18} color={c.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
