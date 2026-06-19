import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daysBetween, estimateDaysToGoal, goalProgressPct, timeElapsedPct } from '@/bodyweight/goal';
import { formatDate, formatKg } from '@/bodyweight/format';
import { weightInsight } from '@/bodyweight/insight';
import { computeTrend, trendSlopePerWeek, type TrendPoint } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { AddWeightSheet } from '@/ui/AddWeightSheet';
import { ProgressRing } from '@/ui/ProgressRing';

type Goal = typeof weightGoal.$inferSelect;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Resumen de peso para Inicio: Inicio / Actual (anillo) / Objetivo + progreso/tiempo + mensaje. */
export function WeightSummaryCard({ reloadNonce }: { reloadNonce?: number }) {
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
    }, [load, reloadNonce]),
  );

  const last = points.at(-1);
  if (!last) return null;

  const todayStr = today();
  const todayExists = points.some((p) => p.date === todayStr);
  const slope = trendSlopePerWeek(points, 14);
  const progressPct = goal ? goalProgressPct({ startKg: goal.startKg, currentTrendKg: last.trendKg, goalKg: goal.targetKg }) : 0;

  let timePct: number | null = null;
  if (goal) {
    if (goal.targetDate) {
      timePct = timeElapsedPct({ startDate: goal.startDate, asOf: todayStr, estimatedTotalDays: daysBetween(goal.startDate, goal.targetDate) });
    } else {
      const days = estimateDaysToGoal({ currentTrendKg: last.trendKg, goalKg: goal.targetKg, slopePerWeek: slope });
      if (days != null) {
        timePct = timeElapsedPct({ startDate: goal.startDate, asOf: todayStr, estimatedTotalDays: daysBetween(goal.startDate, todayStr) + days });
      }
    }
  }

  const insight = weightInsight({ slopePerWeek: slope, currentTrendKg: last.trendKg, goalKg: goal?.targetKg ?? null, pointCount: points.length });

  return (
    <>
      <View style={styles.card}>
        {goal ? (
          <View style={styles.cols}>
            <View style={styles.side}>
              <Text style={styles.colLbl}>Inicio</Text>
              <Text style={styles.colKg}>{formatKg(goal.startKg)}</Text>
              <Text style={styles.colDate}>{formatDate(goal.startDate)}</Text>
            </View>
            <ProgressRing pct={progressPct}>
              <Text style={styles.ringLbl}>Actual</Text>
              <Text style={styles.ringKg}>{formatKg(last.weightKg)}</Text>
            </ProgressRing>
            <View style={styles.side}>
              <Text style={styles.colLbl}>Objetivo</Text>
              <Text style={styles.colKg}>{formatKg(goal.targetKg)}</Text>
              <Text style={styles.colDate}>{goal.targetDate ? formatDate(goal.targetDate) : '—'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.centerOnly}>
            <ProgressRing pct={0}>
              <Text style={styles.ringLbl}>Actual</Text>
              <Text style={styles.ringKg}>{formatKg(last.weightKg)}</Text>
            </ProgressRing>
            <Pressable onPress={() => router.push('/ajustes')}>
              <Text style={styles.link}>🎯 Definir un objetivo de peso</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.enter} onPress={() => setAdding(true)}>
          <Text style={styles.enterTxt}>＋ Entrar peso</Text>
        </Pressable>
        <Pressable onPress={() => router.navigate('/progreso')}>
          <Text style={styles.link}>Ver gráfica e historial ›</Text>
        </Pressable>
      </View>

      {goal && (
        <View style={styles.barsCard}>
          <Bar label="Progreso" pct={progressPct} color={Brand.accent} />
          {timePct != null && <Bar label="Tiempo" pct={timePct} color="#5b8fd4" />}
        </View>
      )}

      {insight && (
        <View style={styles.insight}>
          <Text style={styles.insightH}>{insight.title}</Text>
          <Text style={styles.insightP}>{insight.body}</Text>
        </View>
      )}

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
    </>
  );
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={styles.bar}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barPct}>{Math.round(pct)} %</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
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
  barsCard: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  bar: {},
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase' },
  barPct: { color: Brand.text, fontSize: 11, fontWeight: '700' },
  track: { height: 9, backgroundColor: Brand.track, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 99 },
  insight: { backgroundColor: '#1a2330', borderRadius: 14, padding: 12 },
  insightH: { color: Brand.info, fontWeight: '700', marginBottom: 4 },
  insightP: { color: '#b9c4d0', fontSize: 12 },
});
