import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, daysBetween, estimateDaysToGoal, goalProgressPct, timeElapsedPct } from '@/bodyweight/goal';
import { formatDate, formatKg, friendlyMonth } from '@/bodyweight/format';
import { weightInsight } from '@/bodyweight/insight';
import { computeTrend, trendSlopePerWeek, type TrendPoint } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { SetGoalSheet } from '@/ui/SetGoalSheet';
import { WeightChart } from '@/ui/WeightChart';

type Goal = typeof weightGoal.$inferSelect;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Detalle del peso: gráfica, partida/actual/objetivo, tarjeta de objetivo e insight. Vive en Progreso. */
export function WeightDetail() {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalSheet, setGoalSheet] = useState(false);

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
  const insight = weightInsight({
    slopePerWeek: slope,
    currentTrendKg: last.trendKg,
    goalKg: goal?.targetKg ?? null,
    pointCount: points.length,
  });

  return (
    <View>
      <Text style={styles.h2}>Peso corporal</Text>
      <View style={styles.card}>
        <WeightChart points={points} goalKg={goal?.targetKg} />
      </View>

      {goal ? (
        <GoalCard goal={goal} currentTrendKg={last.trendKg} slopePerWeek={slope} onEdit={() => setGoalSheet(true)} />
      ) : (
        <Pressable style={styles.defineGoal} onPress={() => setGoalSheet(true)}>
          <Text style={styles.defineGoalTxt}>🎯 Definir un objetivo de peso</Text>
        </Pressable>
      )}

      {insight && (
        <View style={styles.insight}>
          <Text style={styles.insightH}>{insight.title}</Text>
          <Text style={styles.insightP}>{insight.body}</Text>
        </View>
      )}

      <SetGoalSheet
        visible={goalSheet}
        initialTargetKg={goal?.targetKg ?? Math.round((last?.trendKg ?? 75) - 4)}
        initialTargetDate={goal?.targetDate ?? addDays(today(), 84)}
        startKg={goal?.startKg ?? last?.trendKg ?? 75}
        startDate={goal?.startDate ?? today()}
        canClear={goal !== null}
        onClose={() => {
          setGoalSheet(false);
          load();
        }}
      />
    </View>
  );
}

function GoalCard({ goal, currentTrendKg, slopePerWeek, onEdit }: { goal: Goal; currentTrendKg: number; slopePerWeek: number; onEdit: () => void }) {
  const days = estimateDaysToGoal({ currentTrendKg, goalKg: goal.targetKg, slopePerWeek });
  const progress = goalProgressPct({ startKg: goal.startKg, currentTrendKg, goalKg: goal.targetKg });
  const remaining = Math.abs(goal.targetKg - currentTrendKg);

  let timePct: number | null = null;
  let metaLine = 'Sin fecha objetivo';
  if (goal.targetDate) {
    metaLine = `📅 Meta: ${formatDate(goal.targetDate)}`;
    const totalDays = daysBetween(goal.startDate, goal.targetDate);
    timePct = timeElapsedPct({ startDate: goal.startDate, asOf: today(), estimatedTotalDays: totalDays });
  }

  let projLine: string | null = null;
  if (days != null) {
    const eta = addDays(today(), days);
    projLine = `A tu ritmo actual, ~${formatDate(eta)} (${friendlyMonth(eta)})`;
    if (!goal.targetDate) {
      const totalDays = daysBetween(goal.startDate, today()) + days;
      timePct = timeElapsedPct({ startDate: goal.startDate, asOf: today(), estimatedTotalDays: totalDays });
    }
  } else if (!goal.targetDate) {
    projLine = 'Sigue registrando para estimar la fecha';
  }

  return (
    <Pressable style={styles.card} onPress={onEdit}>
      <View style={styles.goalHead}>
        <Text style={styles.goalTitle}>🎯 Objetivo: {formatKg(goal.targetKg)}</Text>
        <Text style={styles.muted}>faltan {formatKg(remaining)}</Text>
      </View>
      <Text style={styles.eta}>{metaLine}</Text>
      {projLine && <Text style={styles.proj}>{projLine}</Text>}
      <Bar label="Progreso" pct={progress} color={Brand.accent} />
      {timePct != null && <Bar label="Tiempo transcurrido" pct={timePct} color="#5b8fd4" />}
      <Text style={styles.note}>Es una guía orientativa, no una fecha límite. El cuerpo no es lineal y eso es normal.</Text>
    </Pressable>
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
  h2: { color: Brand.text, fontSize: 18, fontWeight: '800', marginTop: 6, marginBottom: 6 },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  stat: { flex: 1, backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statHighlight: { borderColor: Brand.accentStrong },
  statLabel: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase' },
  statValue: { color: Brand.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
  statDate: { color: Brand.textMuted, fontSize: 10, marginTop: 3 },
  defineGoal: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  defineGoalTxt: { color: Brand.accent, fontWeight: '700' },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalTitle: { color: Brand.text, fontWeight: '700' },
  muted: { color: Brand.textMuted, fontSize: 12 },
  eta: { color: Brand.info, marginTop: 8 },
  proj: { color: Brand.textMuted, fontSize: 12, marginTop: 2, marginBottom: 6 },
  bar: { marginTop: 8 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase' },
  barPct: { color: Brand.text, fontSize: 11, fontWeight: '700' },
  track: { height: 9, backgroundColor: Brand.track, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 99 },
  note: { color: Brand.textMuted, fontSize: 11, marginTop: 8 },
  insight: { backgroundColor: '#1a2330', borderRadius: 14, padding: 12, marginBottom: 10 },
  insightH: { color: Brand.info, fontWeight: '700', marginBottom: 4 },
  insightP: { color: '#b9c4d0', fontSize: 12 },
});
