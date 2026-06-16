import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  addDays,
  daysBetween,
  estimateDaysToGoal,
  goalProgressPct,
  timeElapsedPct,
} from '@/bodyweight/goal';
import { formatDate, formatDelta, formatKg, friendlyMonth } from '@/bodyweight/format';
import { weightInsight } from '@/bodyweight/insight';
import { computeTrend, trendSlopePerWeek, type TrendPoint } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { deleteWeights, getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { AddWeightSheet } from '@/ui/AddWeightSheet';
import { KcalSummaryCard } from '@/ui/KcalSummaryCard';
import { Loading } from '@/ui/Loading';
import { Onboarding } from '@/ui/Onboarding';
import { SetGoalSheet } from '@/ui/SetGoalSheet';
import { WeightChart } from '@/ui/WeightChart';

type Goal = typeof weightGoal.$inferSelect;
type Editing = { date: string; kg: number; isExisting: boolean };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function WeightScreen() {
  const router = useRouter();
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [goalSheet, setGoalSheet] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const ws = await listWeights();
    setPoints(computeTrend(ws, 0.1));
    setGoal(await getGoal());
    setSelected(new Set());
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const last = points.at(-1);

  // Primer arranque: aún cargando.
  if (!loaded) {
    return <Loading />;
  }
  // Sin pesajes todavía → onboarding paso a paso.
  if (!last) {
    return <Onboarding onDone={load} />;
  }

  const slope = trendSlopePerWeek(points, 14);
  const todayStr = today();
  const todayExists = points.some((p) => p.date === todayStr);
  const history = [...points].reverse(); // más reciente primero
  const allSelected = history.length > 0 && selected.size === history.length;
  const insight = weightInsight({
    slopePerWeek: slope,
    currentTrendKg: last.trendKg,
    goalKg: goal?.targetKg ?? null,
    pointCount: points.length,
  });

  function openToday() {
    setEditing({ date: todayStr, kg: last?.weightKg ?? 75, isExisting: todayExists });
  }

  function toggleSelected(date: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(history.map((p) => p.date)));
  }

  async function deleteSelected() {
    await deleteWeights([...selected]);
    load();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.h1}>Inicio</Text>
        <Pressable style={styles.gear} onPress={() => router.push('/ajustes')} hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={Brand.textMuted} />
        </Pressable>
      </View>

      <KcalSummaryCard onPress={() => router.push('/nutricion')} />

      <View style={styles.header}>
        <Text style={styles.h2}>Peso corporal</Text>
        <Pressable style={styles.add} onPress={openToday}>
          <Text style={styles.addTxt}>＋</Text>
        </Pressable>
      </View>

      {/* Peso actual = protagonista; tendencia, secundaria. */}
      <View style={styles.bigRow}>
        <Text style={styles.big}>{formatKg(last.weightKg)}</Text>
        <Text style={styles.muted}>peso actual</Text>
      </View>
      <Text style={styles.trendLine}>
        Tendencia {formatKg(last.trendKg)}
        {points.length >= 2 ? `  ·  ${formatDelta(slope)}/sem` : ''}
      </Text>

      <View style={styles.card}>
        <WeightChart points={points} goalKg={goal?.targetKg} />
      </View>

      {goal && (
        <View style={styles.stats}>
          <Stat label="Partida" value={formatKg(goal.startKg)} date={formatDate(goal.startDate)} />
          <Stat label="Actual" value={formatKg(last.weightKg)} date={formatDate(last.date)} highlight />
          <Stat
            label="Objetivo"
            value={formatKg(goal.targetKg)}
            date={goal.targetDate ? formatDate(goal.targetDate) : undefined}
          />
        </View>
      )}

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

      {/* Historial: seleccionar para borrar en lote, o tocar "editar". */}
      <Text style={styles.histTitle}>Historial</Text>
      <View style={styles.card}>
        <View style={styles.histToolbar}>
          <Pressable onPress={toggleAll}>
            <Text style={styles.selectAll}>{allSelected ? '✕ Quitar selección' : '☑ Seleccionar todo'}</Text>
          </Pressable>
          {selected.size > 0 && (
            <Pressable style={styles.delBtn} onPress={deleteSelected}>
              <Text style={styles.delBtnTxt}>🗑 Borrar ({selected.size})</Text>
            </Pressable>
          )}
        </View>
        {history.map((p, i) => {
          const isSel = selected.has(p.date);
          return (
            <View key={p.date} style={[styles.histRow, i < history.length - 1 && styles.histRowBorder]}>
              <Pressable style={styles.checkHit} onPress={() => toggleSelected(p.date)}>
                <View style={[styles.checkbox, isSel && styles.checkboxOn]}>
                  {isSel && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </Pressable>
              <Text style={styles.histDate}>{shortDate(p.date)}</Text>
              <Text style={styles.histKg}>{formatKg(p.weightKg)}</Text>
              <Pressable onPress={() => setEditing({ date: p.date, kg: p.weightKg, isExisting: true })}>
                <Text style={styles.histEdit}>editar</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <AddWeightSheet
        visible={editing !== null}
        date={editing?.date ?? todayStr}
        initialKg={editing?.kg ?? 75}
        isExisting={editing?.isExisting ?? false}
        onClose={() => {
          setEditing(null);
          load();
        }}
      />
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
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  date,
  highlight,
}: {
  label: string;
  value: string;
  date?: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {date && <Text style={styles.statDate}>{date}</Text>}
    </View>
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

  // Fecha objetivo (la meta fijada) y, aparte, la proyección a tu ritmo real.
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gear: { padding: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  h1: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  h2: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  add: { width: 36, height: 36, borderRadius: 11, backgroundColor: Brand.accentStrong, alignItems: 'center', justifyContent: 'center' },
  addTxt: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  big: { color: Brand.text, fontSize: 36, fontWeight: '800' },
  muted: { color: Brand.textMuted, fontSize: 12 },
  trendLine: { color: Brand.textMuted, fontSize: 13, marginTop: -4 },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statHighlight: { borderColor: Brand.accentStrong },
  statLabel: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase' },
  statValue: { color: Brand.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
  statDate: { color: Brand.textMuted, fontSize: 10, marginTop: 3 },
  defineGoal: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  defineGoalTxt: { color: Brand.accent, fontWeight: '700' },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalTitle: { color: Brand.text, fontWeight: '700' },
  eta: { color: Brand.info, marginTop: 8 },
  proj: { color: Brand.textMuted, fontSize: 12, marginTop: 2, marginBottom: 6 },
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
  histTitle: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', marginTop: 4 },
  histToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: Brand.cardBorder },
  selectAll: { color: Brand.accent, fontSize: 12, fontWeight: '600' },
  delBtn: { backgroundColor: '#3b1f22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  delBtnTxt: { color: '#f87171', fontSize: 12, fontWeight: '700' },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  histRowBorder: { borderBottomWidth: 1, borderBottomColor: Brand.cardBorder },
  checkHit: { padding: 2 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: Brand.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: Brand.accentStrong, borderColor: Brand.accentStrong },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '900' },
  histDate: { color: Brand.textMuted, fontSize: 13, width: 48 },
  histKg: { color: Brand.text, fontSize: 15, fontWeight: '700', flex: 1 },
  histEdit: { color: Brand.accent, fontSize: 12 },
  empty: { color: Brand.textMuted, marginTop: 20 },
});
