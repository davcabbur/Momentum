import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { computeTrend, type TrendPoint } from '@/bodyweight/trend';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { useThemedStyles, type Theme } from '@/ui/theme';
import { WeightChart } from '@/ui/WeightChart';

type Goal = typeof weightGoal.$inferSelect;

/** Gráfica de peso en Progreso (el objetivo y el mensaje viven en Inicio). */
export function WeightDetail({ reloadNonce }: { reloadNonce?: number }) {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setPoints(computeTrend(await listWeights(), 0.1));
    setGoal(await getGoal());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  if (points.length === 0) return null;

  return (
    <View>
      <Text style={styles.h2}>Peso corporal</Text>
      <View style={styles.card}>
        <WeightChart points={points} goalKg={goal?.targetKg} width={width - 14 * 2 - 12 * 2} height={320} />
      </View>
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    h2: { color: c.text, fontSize: 18, fontWeight: '800', marginTop: 6, marginBottom: 6 },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  });
