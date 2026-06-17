import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { goalProgressPct } from '@/bodyweight/goal';
import { formatDate, formatKg } from '@/bodyweight/format';
import { Brand } from '@/constants/theme';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { AddWeightSheet } from '@/ui/AddWeightSheet';

type Goal = typeof weightGoal.$inferSelect;
type Entry = { date: string; weightKg: number };

function diffTxt(d: number): string {
  const v = Math.round(d * 10) / 10;
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(1).replace('.', ',')} kg`;
}

/** Mezcla rojo→verde según el progreso (0..1). */
function progressColor(t: number): string {
  const a = [248, 113, 113]; // rojo
  const b = [52, 211, 153]; // verde
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Historial de pesajes: cada entrada con peso, diferencia, barra de progreso, fecha y editar. */
export function WeightHistory() {
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
    }, [load]),
  );

  if (entries.length === 0) return null;

  const initialKg = goal?.startKg ?? entries[entries.length - 1].weightKg;

  return (
    <View>
      <Text style={styles.title}>Historial de peso</Text>
      {entries.map((e) => {
        const diff = e.weightKg - initialKg;
        const pct = goal ? goalProgressPct({ startKg: goal.startKg, currentTrendKg: e.weightKg, goalKg: goal.targetKg }) : null;
        return (
          <View key={e.date} style={styles.card}>
            <Text style={styles.kg}>{formatKg(e.weightKg)}</Text>
            <Text style={styles.diff}>{diffTxt(diff)} desde el inicio</Text>

            {pct != null && (
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: progressColor(pct / 100) }]} />
              </View>
            )}

            <View style={styles.bottom}>
              <Text style={styles.date}>{formatDate(e.date)}</Text>
              <Pressable style={styles.editBtn} onPress={() => setEditing(e)}>
                <Text style={styles.editTxt}>Editar</Text>
              </Pressable>
            </View>
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
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  kg: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  diff: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
  track: { height: 8, backgroundColor: Brand.track, borderRadius: 99, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', borderRadius: 99 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  date: { color: Brand.textMuted, fontSize: 13 },
  editBtn: { borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 9, paddingVertical: 6, paddingHorizontal: 14 },
  editTxt: { color: Brand.accent, fontWeight: '700', fontSize: 13 },
});
