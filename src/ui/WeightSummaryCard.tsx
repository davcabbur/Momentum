import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daysBetween, estimateDaysToGoal, goalProgressPct, timeElapsedPct } from '@/bodyweight/goal';
import { formatDate, formatKg } from '@/bodyweight/format';
import { weightInsight } from '@/bodyweight/insight';
import { computeTrend, trendSlopePerWeek, type TrendPoint } from '@/bodyweight/trend';
import { getGoal, getProfile, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { getCustomMacros } from '@/nutrition/custom-targets';
import { liveKcalPlan } from '@/nutrition/kcal';
import { AddWeightSheet } from '@/ui/AddWeightSheet';
import { ProgressRing } from '@/ui/ProgressRing';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

type Goal = typeof weightGoal.$inferSelect;
type Profile = Awaited<ReturnType<typeof getProfile>>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function kcalFmt(n: number): string {
  return `${n}`.replace(/\B(?=(\d{3})+(?!\d))/, ' ');
}

/** Formatea kg quitando ceros sobrantes: 0,50→"0,5", 1,00→"1", 0,07→"0,07". */
function kg2(n: number): string {
  return (Math.round(Math.abs(n) * 100) / 100).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

function rateWord(stage: string | null | undefined): string {
  return stage === 'definicion' ? 'Pérdida' : stage === 'volumen' ? 'Ganancia' : 'Cambio';
}

/** Texto de ritmo: magnitud (la palabra ya indica dirección) salvo en normocalórica, con signo. */
function rateStr(kg: number, stage: string | null | undefined): string {
  if (stage === 'definicion' || stage === 'volumen') return `${kg2(kg)} kg`;
  const s = kg > 0.005 ? '+' : kg < -0.005 ? '−' : '';
  return `${s}${kg2(kg)} kg`;
}

/** Resumen de peso para Inicio: Inicio / Actual (anillo) / Objetivo + progreso/tiempo + mensaje. */
export function WeightSummaryCard({ reloadNonce }: { reloadNonce?: number }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [prof, setProf] = useState<Profile>(null);
  const [customKcal, setCustomKcal] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setPoints(computeTrend(await listWeights(), 0.1));
    setGoal(await getGoal());
    setProf(await getProfile());
    setCustomKcal((await getCustomMacros())?.kcal ?? null);
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

  // Ritmo medio (tendencia suavizada): diario = semanal / 7.
  const stage = prof?.stage ?? null;
  const weeklyRate = points.length >= 2 ? slope : null;
  const dailyRate = weeklyRate != null ? weeklyRate / 7 : null;

  // Kcal del día: lo personalizado manda; si no, objetivo (con meta) o mantenimiento (TDEE).
  let kcalShown: number | null = customKcal;
  let kcalSub = 'a tu gusto';
  if (kcalShown == null && prof && prof.heightCm != null && prof.age != null) {
    const hasGoal = goal != null && goal.targetDate != null;
    const daysRemaining = hasGoal ? Math.max(0, daysBetween(todayStr, goal!.targetDate!)) : 0;
    const plan = liveKcalPlan({
      sex: prof.sex,
      age: prof.age,
      heightCm: prof.heightCm,
      activityLevel: prof.activityLevel,
      trendKg: last.trendKg,
      targetKg: goal?.targetKg ?? last.trendKg,
      daysRemaining,
      actualRatePerWeek: points.length >= 3 ? slope : null,
    });
    kcalShown = hasGoal ? plan.adjustedKcal ?? plan.targetKcal : plan.tdee;
    kcalSub = hasGoal ? 'objetivo' : 'mantenimiento';
  }
  const showStats = kcalShown != null || dailyRate != null;

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

        {showStats && (
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.statWord}>{rateWord(stage)}</Text>
              <Text style={styles.statVal}>{dailyRate != null ? rateStr(dailyRate, stage) : '—'}</Text>
              <Text style={styles.statSub}>media diaria</Text>
            </View>
            <View style={[styles.statCell, styles.statCenter]}>
              <Text style={styles.statWord}>Kcal</Text>
              <Text style={[styles.statVal, styles.kcalVal]}>{kcalShown != null ? `≈ ${kcalFmt(kcalShown)}` : '—'}</Text>
              <Text style={styles.statSub}>{kcalSub}</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statWord}>{rateWord(stage)}</Text>
              <Text style={styles.statVal}>{weeklyRate != null ? rateStr(weeklyRate, stage) : '—'}</Text>
              <Text style={styles.statSub}>media semanal</Text>
            </View>
          </View>
        )}

        <Pressable style={styles.enter} onPress={() => setAdding(true)}>
          <Text style={styles.enterTxt}>＋ Entrar peso</Text>
        </Pressable>
        <Pressable onPress={() => router.navigate({ pathname: '/progreso', params: { tab: 'peso' } })}>
          <Text style={styles.link}>Ver gráfica e historial ›</Text>
        </Pressable>
      </View>

      {goal && (
        <View style={styles.barsCard}>
          <Bar label="Progreso" pct={progressPct} color={c.accent} />
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
  const styles = useThemedStyles(makeStyles);
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
    cols: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    centerOnly: { alignItems: 'center', gap: 10 },
    side: { alignItems: 'center', flex: 1, gap: 4 },
    colLbl: { color: c.accent, fontSize: 13, fontWeight: '700' },
    colKg: { color: c.text, fontSize: 16, fontWeight: '800' },
    colDate: { color: c.textMuted, fontSize: 11 },
    ringLbl: { color: c.accent, fontSize: 13, fontWeight: '700' },
    ringKg: { color: c.text, fontSize: 24, fontWeight: '800', marginTop: 2 },
    statRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderTopColor: c.cardBorder, borderTopWidth: 1, paddingTop: 12, marginTop: 2 },
    statCell: { flex: 1, alignItems: 'center', gap: 1 },
    statCenter: { borderLeftColor: c.cardBorder, borderRightColor: c.cardBorder, borderLeftWidth: 1, borderRightWidth: 1 },
    statWord: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    statVal: { color: c.text, fontSize: 15, fontWeight: '800', marginTop: 2 },
    kcalVal: { color: c.good },
    statSub: { color: c.textMuted, fontSize: 10 },
    enter: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 2 },
    enterTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
    link: { color: c.accent, fontSize: 12, fontWeight: '700', textAlign: 'center' },
    barsCard: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
    bar: {},
    barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    barLabel: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase' },
    barPct: { color: c.text, fontSize: 11, fontWeight: '700' },
    track: { height: 9, backgroundColor: c.track, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
    fill: { height: '100%', borderRadius: 99 },
    insight: { backgroundColor: c.infoSurface, borderRadius: 14, padding: 12 },
    insightH: { color: c.info, fontWeight: '700', marginBottom: 4 },
    insightP: { color: c.infoText, fontSize: 12 },
  });
