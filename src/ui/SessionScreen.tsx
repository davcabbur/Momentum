import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { listDayExercises, type DayExercise } from '@/db/routine-repo';
import { findSession, getSessionNote, listSets, setSessionNote } from '@/db/workout-repo';
import { SetLogSheet } from '@/ui/SetLogSheet';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function schemeText(e: DayExercise): string | null {
  return e.targetSets && e.repMin && e.repMax ? `${e.targetSets}×${e.repMin}–${e.repMax}` : null;
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

  const total = exercises.length;
  const done = exercises.filter((e) => (counts[e.exercise.id] ?? 0) > 0).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} hitSlop={8}>
        <Text style={styles.back}>‹ Volver</Text>
      </Pressable>
      <Text style={styles.h1}>{dayName}</Text>

      {total > 0 && (
        <View style={styles.progress}>
          <Text style={styles.progressTxt}>
            {done} de {total} ejercicios
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>
      )}

      {total === 0 && <Text style={styles.muted}>Este día no tiene ejercicios. Edítalo en la rutina.</Text>}

      {exercises.map((e) => {
        const count = counts[e.exercise.id] ?? 0;
        const isDone = count > 0;
        const sch = schemeText(e);
        return (
          <Pressable key={e.rdeId} style={[styles.card, isDone && styles.cardDone]} onPress={() => setOpenItem(e)}>
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={isDone ? Brand.good : Brand.textMuted}
            />
            <View style={styles.exMain}>
              <Text style={styles.exName}>{e.exercise.name}</Text>
              <Text style={styles.exMeta}>{isDone ? `${count} series hechas` : sch ? `Objetivo ${sch}` : 'Toca para registrar'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Brand.textMuted} />
          </Pressable>
        );
      })}

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
  h1: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  progress: { gap: 6 },
  progressTxt: { color: Brand.textMuted, fontSize: 12, fontWeight: '700' },
  track: { height: 8, backgroundColor: Brand.track, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Brand.good, borderRadius: 99 },
  muted: { color: Brand.textMuted },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardDone: { borderColor: '#1f3a2a' },
  exMain: { flex: 1 },
  exName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  exMeta: { color: Brand.textMuted, fontSize: 12, marginTop: 1 },
  noteLbl: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 6 },
  noteInput: { color: Brand.text, fontSize: 14, backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 64, textAlignVertical: 'top' },
  finish: { backgroundColor: Brand.good, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  finishTxt: { color: '#06240f', fontWeight: '800' },
});
