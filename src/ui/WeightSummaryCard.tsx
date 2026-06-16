import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { goalProgressPct } from '@/bodyweight/goal';
import { formatDate, formatKg } from '@/bodyweight/format';
import { computeTrend, type TrendPoint } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { AddWeightSheet } from '@/ui/AddWeightSheet';
import { ProgressRing } from '@/ui/ProgressRing';

type Goal = typeof weightGoal.$inferSelect;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Resumen de peso para Inicio: Inicio / Actual (anillo de progreso) / Objetivo. */
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

  const todayStr = today();
  const todayExists = points.some((p) => p.date === todayStr);
  const pct = goal ? goalProgressPct({ startKg: goal.startKg, currentTrendKg: last.trendKg, goalKg: goal.targetKg }) : 0;

  const ring = (
    <ProgressRing pct={pct}>
      <Text style={styles.ringLbl}>Actual</Text>
      <Text style={styles.ringKg}>{formatKg(last.weightKg)}</Text>
    </ProgressRing>
  );

  return (
    <View style={styles.card}>
      {goal ? (
        <View style={styles.cols}>
          <View style={styles.side}>
            <Text style={styles.colLbl}>Inicio</Text>
            <Text style={styles.colKg}>{formatKg(goal.startKg)}</Text>
            <Text style={styles.colDate}>{formatDate(goal.startDate)}</Text>
          </View>
          {ring}
          <View style={styles.side}>
            <Text style={styles.colLbl}>Objetivo</Text>
            <Text style={styles.colKg}>{formatKg(goal.targetKg)}</Text>
            <Text style={styles.colDate}>{goal.targetDate ? formatDate(goal.targetDate) : '—'}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.centerOnly}>
          {ring}
          <Pressable onPress={() => router.navigate('/progreso')}>
            <Text style={styles.link}>🎯 Definir un objetivo de peso</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.enter} onPress={() => setAdding(true)}>
        <Text style={styles.enterTxt}>＋ Entrar peso</Text>
      </Pressable>
      <Pressable onPress={() => router.navigate('/progreso')}>
        <Text style={styles.link}>Ver progreso ›</Text>
      </Pressable>

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
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  cols: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  centerOnly: { alignItems: 'center', gap: 10 },
  side: { alignItems: 'center', flex: 1, gap: 4 },
  colLbl: { color: Brand.accent, fontSize: 13, fontWeight: '700' },
  colKg: { color: Brand.text, fontSize: 16, fontWeight: '800' },
  colDate: { color: Brand.textMuted, fontSize: 11 },
  ringLbl: { color: Brand.accent, fontSize: 13, fontWeight: '700' },
  ringKg: { color: Brand.text, fontSize: 24, fontWeight: '800', marginTop: 2 },
  enter: { backgroundColor: Brand.accentStrong, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 2 },
  enterTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  link: { color: Brand.accent, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
