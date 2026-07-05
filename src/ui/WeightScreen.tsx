import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listWeights } from '@/db/bodyweight-repo';
import { Loading } from '@/ui/Loading';
import { NextWorkoutCard } from '@/ui/NextWorkoutCard';
import { Onboarding } from '@/ui/Onboarding';
import { StrengthSummaryCard } from '@/ui/StrengthSummaryCard';
import { ActivityCard } from '@/ui/ActivityCard';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { useRefresh } from '@/ui/useRefresh';
import { WeightSummaryCard } from '@/ui/WeightSummaryCard';

/** Inicio: panel ligero con accesos rápidos (entreno, kcal, peso). El detalle vive en cada pestaña. */
export function WeightScreen() {
  const router = useRouter();
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [hasWeights, setHasWeights] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setHasWeights((await listWeights()).length > 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { control, nonce } = useRefresh(load);

  if (hasWeights === null) return <Loading />;
  if (!hasWeights) return <Onboarding onDone={load} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={control}>
      <View style={styles.topBar}>
        <Text style={styles.h1}>Inicio</Text>
        <Pressable style={styles.gear} onPress={() => router.push('/ajustes')} hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={c.textMuted} />
        </Pressable>
      </View>

      <NextWorkoutCard reloadNonce={nonce} />
      <StrengthSummaryCard reloadNonce={nonce} />
      <WeightSummaryCard reloadNonce={nonce} />
      <ActivityCard reloadNonce={nonce} />
      <Pressable style={styles.rankLink} onPress={() => router.push('/ranking' as Href)}>
        <Text style={styles.rankTxt}>🏆 Ranking competitivo</Text>
        <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 12 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    h1: { color: c.text, fontSize: 22, fontWeight: '800' },
    gear: { padding: 4 },
    rankLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16 },
    rankTxt: { color: c.text, fontSize: 15, fontWeight: '700' },
  });
