import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getHistoryRows } from '@/db/workout-repo';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { buildProgress, type ExerciseProgress } from '@/training/progression';

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

/** Mini-dashboard de fuerza para Inicio: los ejercicios del ÚLTIMO entreno (1RM actual +
 *  flecha y diferencia vs la vez anterior). Una fila con scroll horizontal y, al final,
 *  "Ver más" que lleva a Progreso → Fuerza. */
export function StrengthSummaryCard({ reloadNonce }: { reloadNonce?: number }) {
  const router = useRouter();
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState<ExerciseProgress[]>([]);

  const load = useCallback(async () => {
    const all = buildProgress(await getHistoryRows());
    // Fecha del último entreno = punto más reciente de cualquier ejercicio.
    const lastDate = all.reduce((m, ex) => {
      const d = ex.points[ex.points.length - 1]?.date ?? '';
      return d > m ? d : m;
    }, '');
    setItems(lastDate ? all.filter((ex) => (ex.points[ex.points.length - 1]?.date ?? '') === lastDate) : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      <Pressable style={styles.head} onPress={() => router.navigate('/progreso')}>
        <Ionicons name="barbell" size={18} color={c.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Fuerza</Text>
          <Text style={styles.sub}>Último entreno</Text>
        </View>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((ex) => {
          const latest = ex.points[ex.points.length - 1];
          const prev = ex.points.length >= 2 ? ex.points[ex.points.length - 2] : null;
          const diff = prev ? Math.round((latest.e1rm - prev.e1rm) * 10) / 10 : null;
          const dir = diff == null ? 0 : Math.sign(diff);
          const isPR = ex.points.length >= 2 && latest.e1rm >= ex.bestE1rm && dir > 0;
          return (
            <View key={ex.exerciseId} style={styles.chip}>
              <Text style={styles.chipName} numberOfLines={1}>{ex.name}</Text>
              <Text style={styles.chipKg}>{fmt(latest.e1rm)} kg</Text>
              {diff != null ? (
                <View style={styles.diffRow}>
                  <Ionicons
                    name={dir > 0 ? 'arrow-up' : dir < 0 ? 'arrow-down' : 'remove'}
                    size={13}
                    color={dir > 0 ? c.good : c.textMuted}
                  />
                  <Text style={[styles.diffTxt, { color: dir > 0 ? c.good : c.textMuted }]}>
                    {`${diff > 0 ? '+' : diff < 0 ? '−' : ''}${fmt(Math.abs(diff))}`}
                  </Text>
                  {isPR && <Text style={styles.pr}>★ PR</Text>}
                </View>
              ) : (
                <Text style={styles.first}>1ª sesión</Text>
              )}
            </View>
          );
        })}

        <Pressable style={styles.more} onPress={() => router.navigate('/progreso')}>
          <Text style={styles.moreTxt}>Ver más</Text>
          <Ionicons name="chevron-forward" size={16} color={c.accent} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: c.text, fontSize: 15, fontWeight: '800' },
    sub: { color: c.textMuted, fontSize: 11, marginTop: 1 },
    row: { gap: 8, paddingRight: 2 },
    chip: { backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, minWidth: 116 },
    chipName: { color: c.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
    chipKg: { color: c.accent, fontSize: 18, fontWeight: '800' },
    diffRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    diffTxt: { fontSize: 12, fontWeight: '700' },
    pr: { color: c.good, fontSize: 11, fontWeight: '800', marginLeft: 4 },
    first: { color: c.textMuted, fontSize: 11, marginTop: 3 },
    more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 14, borderRadius: 12, borderColor: c.cardBorder, borderWidth: 1, borderStyle: 'dashed' },
    moreTxt: { color: c.accent, fontSize: 13, fontWeight: '700' },
  });
