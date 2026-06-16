import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDelta, formatKg } from '@/bodyweight/format';
import { computeTrend, trendSlopePerWeek, type TrendPoint } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { AddWeightSheet } from '@/ui/AddWeightSheet';

type Goal = typeof weightGoal.$inferSelect;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Resumen compacto de peso para Inicio: actual + tendencia + añadir. Toca para ver el detalle en Progreso. */
export function WeightSummaryCard() {
  const router = useRouter();
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setPoints(computeTrend(await listWeights(), 0.1));
    setGoal(await getGoal());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const last = points.at(-1);
  if (!last) return null;

  const slope = trendSlopePerWeek(points, 14);
  const todayStr = today();
  const todayExists = points.some((p) => p.date === todayStr);
  const remaining = goal ? Math.abs(goal.targetKg - last.trendKg) : null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable style={{ flex: 1 }} onPress={() => router.navigate('/progreso')}>
          <Text style={styles.lbl}>Peso corporal</Text>
          <Text style={styles.big}>{formatKg(last.weightKg)}</Text>
          <Text style={styles.sub}>
            Tendencia {formatKg(last.trendKg)}
            {points.length >= 2 ? ` · ${formatDelta(slope)}/sem` : ''}
            {remaining != null ? ` · faltan ${formatKg(remaining)}` : ''}
          </Text>
          <Text style={styles.link}>Ver progreso ›</Text>
        </Pressable>
        <Pressable style={styles.add} onPress={() => setAdding(true)}>
          <Text style={styles.addTxt}>＋</Text>
        </Pressable>
      </View>

      <AddWeightSheet
        visible={adding}
        date={todayStr}
        initialKg={last.weightKg}
        isExisting={todayExists}
        onClose={() => {
          setAdding(false);
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lbl: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  big: { color: Brand.text, fontSize: 28, fontWeight: '800', marginTop: 2 },
  sub: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  link: { color: Brand.accent, fontSize: 12, fontWeight: '700', marginTop: 6 },
  add: { width: 44, height: 44, borderRadius: 12, backgroundColor: Brand.accentStrong, alignItems: 'center', justifyContent: 'center' },
  addTxt: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 26 },
});
