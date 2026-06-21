import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles, type Theme } from '@/ui/theme';

/**
 * Bienvenida al abrir la app: logo + nombre, con animación de entrada (fundido + zoom)
 * y de salida. Avisa con `onFinish` cuando termina, para dar paso al login o a la app.
 */
export function WelcomeScreen({ onFinish }: { onFinish?: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      ]),
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 450, useNativeDriver: true }),
      ]),
    ]);
    anim.start(({ finished }) => {
      if (finished) onFinish?.();
    });
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.inner, { opacity, transform: [{ scale }] }]}>
        <Image source={require('../../assets/images/android-icon-foreground.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.name}>Momentum</Text>
        <Text style={styles.tag}>Tu entrenador que entiende y educa</Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
    inner: { alignItems: 'center' },
    logo: { width: 168, height: 168 },
    name: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: 0.5, marginTop: 4 },
    tag: { color: c.textMuted, fontSize: 13, marginTop: 4 },
  });
