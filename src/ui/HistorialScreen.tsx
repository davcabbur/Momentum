import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatDate } from '@/bodyweight/format';
import { Brand } from '@/constants/theme';
import { listSessions, type SessionSummary } from '@/db/workout-repo';

function vol(n: number): string {
  return `${Math.round(n)}`.replace(/\B(?=(\d{3})+(?!\d))/, ' ');
}

export function HistorialScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const s = await listSessions();
        if (active) {
          setSessions(s);
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
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
        <Ionicons name="chevron-back" size={22} color={Brand.accent} />
        <Text style={styles.back}>Progreso</Text>
      </Pressable>
      <Text style={styles.h1}>Historial de sesiones</Text>

      {loaded && sessions.length === 0 && (
        <Text style={styles.empty}>Aún no hay sesiones registradas. Entrena y aquí verás tu historial. 💪</Text>
      )}

      {sessions.map((s) => {
        const isOpen = open === s.sessionId;
        return (
          <View key={s.sessionId} style={styles.card}>
            <Pressable style={styles.head} onPress={() => setOpen(isOpen ? null : s.sessionId)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{formatDate(s.date)}</Text>
                <Text style={styles.sub}>
                  {s.dayName ? `${s.dayName} · ` : ''}{s.totalSets} series · {vol(s.totalVolume)} kg de volumen
                </Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Brand.textMuted} />
            </Pressable>
            {isOpen && s.note && <Text style={styles.note}>📝 {s.note}</Text>}
            {isOpen &&
              s.exercises.map((ex, i) => (
                <View key={i} style={styles.exBlock}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exSets}>
                    {ex.sets.map((set) => `${set.weightKg}×${set.reps}${set.setType === 'warmup' ? ' (cal.)' : ''}`).join('   ')}
                  </Text>
                </View>
              ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 10 },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: Brand.accent, fontWeight: '700', fontSize: 15 },
  h1: { color: Brand.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  empty: { color: Brand.textMuted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'center' },
  date: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  sub: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  note: { color: Brand.info, fontSize: 13, marginTop: 8, fontStyle: 'italic', lineHeight: 18 },
  exBlock: { marginTop: 10, borderTopWidth: 1, borderTopColor: Brand.cardBorder, paddingTop: 8 },
  exName: { color: Brand.text, fontSize: 14, fontWeight: '600' },
  exSets: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
});
