import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  addDays,
  daysBetween,
  estimateDaysToGoal,
  goalProgressPct,
  timeElapsedPct,
} from '@/bodyweight/goal';
import { formatDelta, formatKg, friendlyMonth } from '@/bodyweight/format';
import { computeTrend, trendSlopePerWeek, type TrendPoint } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { AddWeightSheet } from '@/ui/AddWeightSheet';
import { SetGoalSheet } from '@/ui/SetGoalSheet';
import { WeightChart } from '@/ui/WeightChart';

type Goal = typeof weightGoal.$inferSelect;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WeightScreen() {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weightSheet, setWeightSheet] = useState(false);
  const [goalSheet, setGoalSheet] = useState(false);

  const load = useCallback(async () => {
    const ws = await listWeights();
    setPoints(computeTrend(ws, 0.1));
    setGoal(await getGoal());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const last = points.at(-1);
  const prev = points.at(-2);
  const slope = trendSlopePerWeek(points, 14);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.h1}>Peso corporal</Text>
        <Pressable style={styles.add} onPress={() => setWeightSheet(true)}>
          <Text style={styles.addTxt}>＋</Text>
        </Pressable>
      </View>

      {last ? (
        <>
          <View style={styles.bigRow}>
            <Text style={styles.big}>{formatKg(last.trendKg)}</Text>
            <Text style={styles.muted}>tendencia</Text>
            {prev && <Text style={styles.delta}>{formatDelta(last.trendKg - prev.trendKg)}</Text>}
          </View>

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

          <View style={styles.insight}>
            <Text style={styles.insightH}>💡 Tranquilo</Text>
            <Text style={styles.insightP}>
              Una subida de un día suele ser agua o glucógeno, no grasa. Mira la línea de tendencia, no el número del
              día.
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.empty}>Aún no hay pesajes. Toca ＋ para registrar el primero.</Text>
      )}

      <AddWeightSheet
        visible={weightSheet}
        initialKg={last?.weightKg ?? 75}
        date={today()}
        onClose={() => {
          setWeightSheet(false);
          load();
        }}
      />
      <SetGoalSheet
        visible={goalSheet}
        initialTargetKg={goal?.targetKg ?? Math.round((last?.trendKg ?? 75) - 4)}
        startKg={goal?.startKg ?? last?.trendKg ?? 75}
        startDate={goal?.startDate ?? today()}
        onClose={() => {
          setGoalSheet(false);
          load();
        }}
      />
    </ScrollView>
  );
}

function GoalCard({
  goal,
  currentTrendKg,
  slopePerWeek,
  onEdit,
}: {
  goal: Goal;
  currentTrendKg: number;
  slopePerWeek: number;
  onEdit: () => void;
}) {
  const days = estimateDaysToGoal({ currentTrendKg, goalKg: goal.targetKg, slopePerWeek });
  const progress = goalProgressPct({ startKg: goal.startKg, currentTrendKg, goalKg: goal.targetKg });
  const remaining = Math.abs(goal.targetKg - currentTrendKg);

  let etaText = 'Sigue registrando para estimar la fecha';
  let timePct: number | null = null;
  if (days != null) {
    const totalDays = daysBetween(goal.startDate, today()) + days;
    timePct = timeElapsedPct({ startDate: goal.startDate, asOf: today(), estimatedTotalDays: totalDays });
    etaText = `Llegarías hacia ${friendlyMonth(addDays(today(), days))} a tu ritmo actual`;
  }

  return (
    <Pressable style={styles.card} onPress={onEdit}>
      <View style={styles.goalHead}>
        <Text style={styles.goalTitle}>🎯 Objetivo: {formatKg(goal.targetKg)}</Text>
        <Text style={styles.muted}>faltan {formatKg(remaining)}</Text>
      </View>
      <Text style={styles.eta}>{etaText}</Text>

      <Bar label="Progreso" pct={progress} color={Brand.accent} />
      {timePct != null && <Bar label="Tiempo transcurrido" pct={timePct} color="#5b8fd4" />}

      <Text style={styles.note}>
        Es una guía orientativa, no una fecha límite. El cuerpo no es lineal y eso es normal.
      </Text>
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
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  add: { width: 36, height: 36, borderRadius: 11, backgroundColor: Brand.accentStrong, alignItems: 'center', justifyContent: 'center' },
  addTxt: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  big: { color: Brand.text, fontSize: 32, fontWeight: '800' },
  muted: { color: Brand.textMuted, fontSize: 12 },
  delta: { color: Brand.good, marginLeft: 'auto', fontWeight: '700' },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12 },
  defineGoal: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  defineGoalTxt: { color: Brand.accent, fontWeight: '700' },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalTitle: { color: Brand.text, fontWeight: '700' },
  eta: { color: Brand.info, marginVertical: 8 },
  bar: { marginTop: 8 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase' },
  barPct: { color: Brand.text, fontSize: 11, fontWeight: '700' },
  track: { height: 9, backgroundColor: Brand.track, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 99 },
  note: { color: Brand.textMuted, fontSize: 11, marginTop: 8 },
  insight: { backgroundColor: '#1a2330', borderRadius: 14, padding: 12 },
  insightH: { color: Brand.info, fontWeight: '700', marginBottom: 4 },
  insightP: { color: '#b9c4d0', fontSize: 12 },
  empty: { color: Brand.textMuted, marginTop: 20 },
});
