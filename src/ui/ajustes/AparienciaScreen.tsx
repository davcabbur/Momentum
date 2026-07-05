import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme, type ThemeMode } from '@/ui/theme';
import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

const THEMES: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
  { key: 'system', label: 'Automático' },
];

export function AparienciaScreen() {
  const styles = useAjustesStyles();
  const { mode, setMode } = useTheme();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Apariencia" />
      <View style={styles.card}>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <Pressable key={t.key} style={[styles.pill, mode === t.key && styles.pillOn]} onPress={() => setMode(t.key)}>
              <Text style={[styles.pillTxt, mode === t.key && styles.pillTxtOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>«Automático» sigue el tema de tu móvil. Cámbialo a Claro u Oscuro para forzarlo.</Text>
      </View>
    </ScrollView>
  );
}
