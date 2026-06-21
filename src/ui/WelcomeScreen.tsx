import { Image, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles, type Theme } from '@/ui/theme';

/** Bienvenida breve al abrir la app: logo + nombre. Luego da paso al login o a la app. */
export function WelcomeScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.screen}>
      <Image source={require('../../assets/images/android-icon-foreground.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.name}>Momentum</Text>
      <Text style={styles.tag}>Tu entrenador que entiende y educa</Text>
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
    logo: { width: 168, height: 168 },
    name: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: 0.5, marginTop: 4 },
    tag: { color: c.textMuted, fontSize: 13, marginTop: 4 },
  });
