import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

// Splash de marca: siempre oscuro (tokens de marca), en ambos temas.
const BG = '#0E0F13';
const TEXT = '#F3F5F9';
const MUTED = '#969CAB';
const VIOLET = '#6353EF';

/**
 * Bienvenida animada (splash) según el handoff: el logo sube y aparece, luego el
 * nombre y la frase, una barra de progreso, y a los ~2,6 s se desvanece dando paso
 * al login. Se puede saltar tocando la pantalla y respeta "reducir movimiento".
 */
export function WelcomeScreen({ onFinish }: { onFinish?: () => void }) {
  const tileOp = useRef(new Animated.Value(0)).current;
  const tileY = useRef(new Animated.Value(18)).current;
  const wordOp = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(14)).current;
  const tagOp = useRef(new Animated.Value(0)).current;
  const tagY = useRef(new Animated.Value(14)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(1)).current;
  const containerOp = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const done = useRef(false);

  function finish() {
    if (done.current) return;
    done.current = true;
    onFinish?.();
  }

  useEffect(() => {
    let cancelled = false;
    let exit: ReturnType<typeof setTimeout>;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        [tileOp, wordOp, tagOp, progress].forEach((v) => v.setValue(1));
        [tileY, wordY, tagY].forEach((v) => v.setValue(0));
        exit = setTimeout(finish, 700);
        return;
      }
      const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
      Animated.parallel([
        Animated.timing(tileOp, { toValue: 1, duration: 700, easing: ease, useNativeDriver: true }),
        Animated.timing(tileY, { toValue: 0, duration: 700, easing: ease, useNativeDriver: true }),
        Animated.timing(wordOp, { toValue: 1, duration: 600, delay: 900, useNativeDriver: true }),
        Animated.timing(wordY, { toValue: 0, duration: 600, delay: 900, easing: ease, useNativeDriver: true }),
        Animated.timing(tagOp, { toValue: 1, duration: 600, delay: 1100, useNativeDriver: true }),
        Animated.timing(tagY, { toValue: 0, duration: 600, delay: 1100, easing: ease, useNativeDriver: true }),
      ]).start();
      Animated.timing(progress, { toValue: 1, duration: 2100, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(halo, { toValue: 1.12, duration: 1700, useNativeDriver: true }),
          Animated.timing(halo, { toValue: 1, duration: 1700, useNativeDriver: true }),
        ]),
      ).start();
      exit = setTimeout(() => {
        Animated.parallel([
          Animated.timing(containerOp, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(containerScale, { toValue: 1.04, duration: 500, useNativeDriver: true }),
        ]).start(({ finished }) => {
          if (finished) finish();
        });
      }, 2600);
    });
    return () => {
      cancelled = true;
      clearTimeout(exit);
    };
  }, []);

  return (
    <Pressable style={styles.screen} onPress={finish}>
      <Animated.View style={[styles.center, { opacity: containerOp, transform: [{ scale: containerScale }] }]}>
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.halo, { transform: [{ scale: halo }] }]} />
          <Animated.Image
            source={require('../../assets/images/icon.png')}
            style={[styles.tile, { opacity: tileOp, transform: [{ translateY: tileY }] }]}
            resizeMode="cover"
          />
        </View>
        <Animated.Text style={[styles.name, { opacity: wordOp, transform: [{ translateY: wordY }] }]}>Momentum</Animated.Text>
        <Animated.Text style={[styles.tag, { opacity: tagOp, transform: [{ translateY: tagY }] }]}>Cada paso, hacia arriba.</Animated.Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 108] }) }]} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  logoWrap: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 188, height: 188, borderRadius: 94, backgroundColor: 'rgba(99,83,239,0.20)' },
  tile: { width: 108, height: 108, borderRadius: 26 },
  name: { color: TEXT, fontSize: 38, fontWeight: '800', letterSpacing: 0.5, marginTop: 28 },
  tag: { color: MUTED, fontSize: 15, marginTop: 8 },
  progressTrack: { width: 108, height: 3, borderRadius: 2, backgroundColor: 'rgba(142,128,255,0.18)', overflow: 'hidden', marginTop: 28 },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: VIOLET },
});
