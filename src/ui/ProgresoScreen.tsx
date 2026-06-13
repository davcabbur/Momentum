import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { getHistoryRows } from '@/db/workout-repo';
import { buildProgress, type ExerciseProgress } from '@/training/progression';
import { detectStall, deloadAdvice } from '@/training/intelligence';
import { LineChart } from './LineChart';

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

export function ProgresoScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ExerciseProgress[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const rows = await getHistoryRows();
        if (active) {
          setItems(buildProgress(rows));
          setLoaded(true);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Progreso</Text>
      <Text style={styles.intro}>Tu fuerza estimada (1RM) y volumen por ejercicio. Orienta, no presiona.</Text>

      <Pressable style={styles.histBtn} onPress={() => router.push('/historial')}>
        <Ionicons name="calendar-outline" size={18} color={Brand.accent} />
        <Text style={styles.histTxt}>Historial de sesiones</Text>
        <Ionicons name="chevron-forward" size={18} color={Brand.textMuted} />
      </Pressable>

      {loaded && items.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>Aún no hay sesiones registradas. Entrena y registra tus series para ver aquí tu progreso. 💪</Text>
        </View>
      )}

      {items.map((ex) => {
        const latest = ex.points[ex.points.length - 1];
        const advice = deloadAdvice(ex.name, detectStall(ex.points.map((p) => p.e1rm)));
        return (
          <View key={ex.exerciseId} style={styles.card}>
            <Text style={styles.name}>{ex.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{fmt(ex.bestE1rm)} kg</Text>
                <Text style={styles.statLbl}>PR (1RM est.)</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{fmt(latest.e1rm)} kg</Text>
                <Text style={styles.statLbl}>1RM actual</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{fmt(latest.volume)}</Text>
                <Text style={styles.statLbl}>Volumen últ.</Text>
              </View>
            </View>
            {ex.points.length >= 2 ? (
              <LineChart values={ex.points.map((p) => p.e1rm)} />
            ) : (
              <Text style={styles.note}>Necesitas otra sesión para ver la tendencia.</Text>
            )}
            {advice && <Text style={styles.deload}>🔋 {advice.text}</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 10 },
  h1: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  intro: { color: Brand.textMuted, fontSize: 13, marginBottom: 4 },
  empty: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, padding: 18 },
  emptyTxt: { color: Brand.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  name: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { color: Brand.accent, fontSize: 17, fontWeight: '800' },
  statLbl: { color: Brand.textMuted, fontSize: 11, marginTop: 2 },
  note: { color: Brand.textMuted, fontSize: 12, fontStyle: 'italic' },
  deload: { color: '#fbbf24', fontSize: 12, lineHeight: 18, marginTop: 2 },
  histBtn: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  histTxt: { color: Brand.text, fontSize: 15, fontWeight: '600', flex: 1 },
});
