import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
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
  /** Sesión en curso bloqueada: oculta "Volver"; solo se sale con "Terminar entreno". */
  locked?: boolean;
}

export function SessionScreen({ dayId, dayName, onBack, locked = false }: Props) {
  const { c: theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<DayExercise[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [openItem, setOpenItem] = useState<DayExercise | null>(null);
  const [note, setNote] = useState('');
  const scrollRef = useRef<ScrollView>(null);

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
    <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!locked && (
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
      )}
      {locked && <Text style={styles.live}>● Entreno en curso</Text>}
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
              color={isDone ? theme.good : theme.textMuted}
            />
            <View style={styles.exMain}>
              <Text style={styles.exName}>{e.exercise.name}</Text>
              <Text style={styles.exMeta}>{isDone ? `${count} series hechas` : sch ? `Objetivo ${sch}` : 'Toca para registrar'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
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
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
            placeholder="Cómo te sentiste, molestias, energía…"
            placeholderTextColor={theme.textMuted}
            multiline
          />
        </>
      )}

      {(locked || sessionId != null) && (
        <Pressable
          style={styles.finish}
          onPress={async () => {
            await saveNote();
            onBack();
          }}>
          <Text style={styles.finishTxt}>✓ Terminar entreno</Text>
        </Pressable>
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, paddingBottom: 28, gap: 10 },
    back: { color: c.accent, fontWeight: '700' },
    live: { color: c.good, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
    h1: { color: c.text, fontSize: 22, fontWeight: '800' },
    progress: { gap: 6 },
    progressTxt: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
    track: { height: 8, backgroundColor: c.track, borderRadius: 99, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: c.good, borderRadius: 99 },
    muted: { color: c.textMuted },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardDone: { borderColor: '#1f3a2a' },
    exMain: { flex: 1 },
    exName: { color: c.text, fontSize: 16, fontWeight: '700' },
    exMeta: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    noteLbl: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 6 },
    noteInput: { color: c.text, fontSize: 14, backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 64, textAlignVertical: 'top' },
    finish: { backgroundColor: c.good, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
    finishTxt: { color: c.onGood, fontWeight: '800' },
  });
