import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daysBetween, weighInSegments } from '@/bodyweight/goal';
import { formatKg } from '@/bodyweight/format';
import { Brand } from '@/constants/theme';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { AddWeightSheet } from '@/ui/AddWeightSheet';

type Goal = typeof weightGoal.$inferSelect;
type Entry = { date: string; weightKg: number };

function diffTxt(d: number): string {
  const v = Math.round(d * 10) / 10;
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(1).replace('.', ',')}`;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Historial de pesajes: cada entrada con peso, diferencia, barra de progreso, fecha y editar. */
export function WeightHistory({ reloadNonce }: { reloadNonce?: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);

  const load = useCallback(async () => {
    const ws = await listWeights();
    ws.sort((a, b) => b.date.localeCompare(a.date)); // recientes primero
    setEntries(ws);
    setGoal(await getGoal());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  if (entries.length === 0) return null;

  const initialKg = goal?.startKg ?? entries[entries.length - 1].weightKg;
  // Ritmo semanal estipulado (kg/sem): negativo si el objetivo es bajar.
  const planned =
    goal && goal.targetDate
      ? (goal.targetKg - goal.startKg) / (daysBetween(goal.startDate, goal.targetDate) / 7)
      : goal
        ? Math.sign(goal.targetKg - goal.startKg) * 0.5
        : null;

  return (
    <View>
      <Text style={styles.title}>Historial de peso</Text>
      {entries.map((e, i) => {
        const diff = e.weightKg - initialKg;
        const prev = entries[i + 1] ?? (goal ? { date: goal.startDate, weightKg: goal.startKg } : null);
        const bar = planned != null && prev ? weighInSegments({ change: e.weightKg - prev.weightKg, plannedRatePerWeek: planned }) : null;
        return (
          <View key={e.date} style={styles.card}>
            <View style={styles.wcol}>
              <Text style={styles.kg}>{formatKg(e.weightKg)}</Text>
              <Text style={styles.diff}>{diffTxt(diff)}</Text>
            </View>
            <View style={styles.segments}>
              {[0, 1, 2, 3, 4].map((s) => {
                const on = bar ? s < bar.segments : false;
                return <View key={s} style={[styles.seg, { backgroundColor: on ? (bar?.toward ? Brand.good : '#f87171') : Brand.track }]} />;
              })}
            </View>
            <Text style={styles.date}>{shortDate(e.date)}</Text>
            <Pressable style={styles.editBtn} hitSlop={8} onPress={() => setEditing(e)}>
              <Ionicons name="pencil" size={18} color={Brand.accent} />
            </Pressable>
          </View>
        );
      })}

      <AddWeightSheet
        visible={editing !== null}
        date={editing?.date ?? ''}
        initialKg={editing?.weightKg ?? 75}
        isExisting
        onClose={() => {
          setEditing(null);
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 4, marginBottom: 6 },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  wcol: { minWidth: 70 },
  kg: { color: Brand.text, fontSize: 16, fontWeight: '800' },
  diff: { color: Brand.textMuted, fontSize: 12, marginTop: 1 },
  segments: { flex: 1, flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 9, borderRadius: 3 },
  date: { color: Brand.textMuted, fontSize: 12, minWidth: 38, textAlign: 'right' },
  editBtn: { padding: 2 },
});
