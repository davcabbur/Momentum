import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { listDayExercises, type Exercise } from '@/db/routine-repo';
import { getOrCreateSession, listSets } from '@/db/workout-repo';
import { SetLogSheet } from '@/ui/SetLogSheet';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  dayId: number;
  dayName: string;
  onBack: () => void;
}

export function SessionScreen({ dayId, dayName, onBack }: Props) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<{ rdeId: number; exercise: Exercise }[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [openEx, setOpenEx] = useState<Exercise | null>(null);

  const load = useCallback(async () => {
    const sid = await getOrCreateSession(today(), dayId);
    setSessionId(sid);
    const exs = await listDayExercises(dayId);
    setExercises(exs);
    const c: Record<number, number> = {};
    for (const e of exs) c[e.exercise.id] = (await listSets(sid, e.exercise.id)).length;
    setCounts(c);
  }, [dayId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>‹ Volver</Text>
      </Pressable>
      <Text style={styles.h1}>{dayName}</Text>
      {exercises.length === 0 && <Text style={styles.muted}>Este día no tiene ejercicios. Edítalo en la rutina.</Text>}
      {exercises.map((e) => (
        <Pressable key={e.rdeId} style={styles.card} onPress={() => setOpenEx(e.exercise)}>
          <Text style={styles.exName}>{e.exercise.name}</Text>
          <Text style={styles.exMeta}>{counts[e.exercise.id] ? `${counts[e.exercise.id]} series ✓` : 'registrar ›'}</Text>
        </Pressable>
      ))}
      {sessionId != null && (
        <SetLogSheet
          visible={openEx != null}
          sessionId={sessionId}
          exerciseId={openEx?.id ?? 0}
          exerciseName={openEx?.name ?? ''}
          onClose={() => {
            setOpenEx(null);
            load();
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 10 },
  back: { color: Brand.accent, fontWeight: '700' },
  h1: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  muted: { color: Brand.textMuted },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  exMeta: { color: Brand.accent, fontSize: 13 },
});
