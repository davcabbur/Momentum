import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { ScrollView, Text, View } from 'react-native';

import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

/**
 * Identifica la build/actualización en curso. La versión cambia al recompilar;
 * la actualización (id + fecha) cambia con cada `eas update` y cada build.
 */
function buildInfo(): { version: string; update: string; channel: string | null } {
  const v = Constants.expoConfig?.version ?? '—';
  const code = Constants.expoConfig?.android?.versionCode;
  const version = `Momentum ${v}${code != null ? ` · build ${code}` : ''}`;

  const when = Updates.createdAt
    ? `${Updates.createdAt.toLocaleDateString('es-ES')} ${Updates.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : null;
  const update = Updates.isEmbeddedLaunch
    ? `Incrustada en la build${when ? ` · ${when}` : ''}`
    : `OTA ${Updates.updateId ? Updates.updateId.slice(0, 8) : '—'}${when ? ` · ${when}` : ''}`;
  return { version, update, channel: Updates.channel ?? null };
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
        {info.channel && <Text style={styles.aboutSub}>Canal: {info.channel}</Text>}
      </View>
    </ScrollView>
  );
}
