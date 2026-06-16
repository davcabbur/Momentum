import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { listDayExercises, type DayExercise } from '@/db/routine-repo';
import { findSession, getSessionNote, listSets, setSessionNote } from '@/db/workout-repo';
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
  const [exercises, setExercises] = useState<DayExercise[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [openItem, setOpenItem] = useState<DayExercise | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const sid = await findSession(today(), dayId);
    setSessionId(sid);
    const exs = await listDayExercises(dayId);
    setExercises(Array.isArray(exs) ? exs : []);
    const c: Record<number, number> = {};
    if (sid != null) {
      for (const e of exs) c[e.exercise.id] = (await listSets(sid, e.exercise.id)).length;
      setNote((await getSessionNote(sid)) ?? '');
    }
    setCounts(c);
  }, [dayId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNote() {
    if (sessionId != null) await setSessionNote(sessionId, note);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>‹ Volver</Text>
      </Pressable>
      <Text style={styles.h1}>{dayName}</Text>
      {exercises.length === 0 && <Text style={styles.muted}>Este día no tiene ejercicios. Edítalo en la rutina.</Text>}
      {exercises.map((e) => (
        <Pressable key={e.rdeId} style={styles.card} onPress={() => setOpenItem(e)}>
          <Text style={styles.exName}>{e.exercise.name}</Text>
          <Text style={styles.exMeta}>{counts[e.exercise.id] ? `${counts[e.exercise.id]} series ✓` : 'registrar ›'}</Text>
        </Pressable>
      ))}

      {sessionId != null && (
        <>
          <Text style={styles.noteLbl}>Nota de la sesión</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            onBlur={saveNote}
            placeholder="Cómo te sentiste, molestias, energía…"
            placeholderTextColor={Brand.textMuted}
            multiline
          />
          <Pressable
            style={styles.finish}
            onPress={async () => {
              await saveNote();
              onBack();
            }}>
            <Text style={styles.finishTxt}>✓ Terminar entreno</Text>
          </Pressable>
        </>
      )}

      <SetLogSheet
        visible={openItem != null}
        sessionId={sessionId}
        dayId={dayId}
        date={today()}
        exerciseId={openItem?.exercise.id ?? 0}
        exerciseName={openItem?.exercise.name ?? ''}
        muscleGroup={openItem?.exercise.muscleGroup}
        targetSets={openItem?.targetSets ?? null}
        repMin={openItem?.repMin ?? null}
        repMax={openItem?.repMax ?? null}
        onSessionCreated={(id) => setSessionId(id)}
        onClose={() => {
          setOpenItem(null);
          load();
        }}
      />
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
  noteLbl: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 6 },
  noteInput: { color: Brand.text, fontSize: 14, backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 64, textAlignVertical: 'top' },
  finish: { backgroundColor: Brand.good, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  finishTxt: { color: '#06240f', fontWeight: '800' },
});
