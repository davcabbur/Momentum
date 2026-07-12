import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { ScrollView, Text, View } from 'react-native';

import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

/**
 * Identifica la build/actualización en curso. La versión cambia al recompilar;
 * la actualización (id + fecha) cambia con cada `eas update` y cada build.
 */
function buildInfo(): { version: string; update: string; detail: string | null } {
  const v = Constants.expoConfig?.version ?? '—';
  const code = Constants.expoConfig?.android?.versionCode;
  const version = `Momentum ${v}${code != null ? ` (${code})` : ''}`;

  const when = Updates.createdAt
    ? `${Updates.createdAt.toLocaleDateString('es-ES')} ${Updates.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : null;
  const update = Updates.isEmbeddedLaunch
    ? 'App al día con la versión instalada'
    : `Última actualización: ${when ?? '—'}`;

  const parts: string[] = [];
  if (!Updates.isEmbeddedLaunch && Updates.updateId) parts.push(`id ${Updates.updateId.slice(0, 8)}`);
  if (Updates.channel) parts.push(`canal ${Updates.channel}`);
  return { version, update, detail: parts.length ? parts.join(' · ') : null };
}

export function AcercaScreen() {
  const styles = useAjustesStyles();
  const info = buildInfo();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Acerca de" />
      <View style={styles.card}>
        <Text style={styles.aboutMain}>{info.version}</Text>
        <Text style={styles.aboutSub}>{info.update}</Text>
        {info.detail && <Text style={styles.aboutSub}>{info.detail}</Text>}
      </View>
    </ScrollView>
  );
}
