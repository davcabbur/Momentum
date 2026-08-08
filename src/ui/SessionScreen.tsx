import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/lib/alert';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { getProfile } from '@/db/bodyweight-repo';
import { listExercises, type Exercise } from '@/db/exercise-repo';
import { listDayExercises, replaceDayExercise, type DayExercise } from '@/db/routine-repo';
import { getSetting, setSetting } from '@/db/settings-repo';
import { findSession, getSessionNote, listSets, setSessionNote } from '@/db/workout-repo';
import { defaultScheme } from '@/training/default-scheme';
import type { Level } from '@/training/levels';
import { SetLogSheet } from '@/ui/SetLogSheet';
import { SubstituteSheet } from '@/ui/SubstituteSheet';

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
  const [subs, setSubs] = useState<Record<number, Exercise>>({}); // rdeId → ejercicio de hoy
  const [subFor, setSubFor] = useState<DayExercise | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    const sid = await findSession(today(), dayId);
    setSessionId(sid);
    const exs = await listDayExercises(dayId);
    setExercises(Array.isArray(exs) ? exs : []);

    const raw = await getSetting('sessionSubs');
    let map: Record<number, Exercise> = {};
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (p.date === today() && p.dayId === dayId && p.map) {
          const all = await listExercises();
          const byId = new Map(all.map((x) => [x.id, x]));
          for (const [rdeId, exId] of Object.entries(p.map as Record<string, number>)) {
            const found = byId.get(exId);
            if (found) map[Number(rdeId)] = found;
          }
        }
      } catch {}
    }
    setSubs(map);

    const c: Record<number, number> = {};
    if (sid != null) {
      for (const e of exs) {
        const exId = (map[e.rdeId] ?? e.exercise).id;
        c[exId] = (await listSets(sid, exId)).length;
      }
      setNote((await getSessionNote(sid)) ?? '');
    }
    setCounts(c);
  }, [dayId]);

  useEffect(() => {
    load();
  }, [load]);

  function effective(e: DayExercise): DayExercise {
    const sub = subs[e.rdeId];
    return sub ? { ...e, exercise: sub } : e;
  }

  async function saveNote() {
    if (sessionId != null) await setSessionNote(sessionId, note);
  }

  const total = exercises.length;
  const done = exercises.filter((e) => (counts[effective(e).exercise.id] ?? 0) > 0).length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const hasSets = done > 0;

  // Salir para elegir otro entreno. Si ya hay series registradas, confirma (se conservan).
  function exitToChange() {
    if (hasSets) {
      Alert.alert('Cambiar de entreno', 'Lo que has registrado se conserva. ¿Salir de este entreno?', [
        { text: 'Seguir', style: 'cancel' },
        { text: 'Salir', onPress: onBack },
      ]);
    } else {
      onBack();
    }
  }

  return (
    <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {locked ? (
        <View style={styles.topRow}>
          <Pressable onPress={exitToChange} hitSlop={8}>
            <Text style={styles.back}>‹ Cambiar entreno</Text>
          </Pressable>
          <Text style={styles.live}>● En curso</Text>
        </View>
      ) : (
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
      )}
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
        const eff = effective(e);
        const count = counts[eff.exercise.id] ?? 0;
        const isDone = count > 0;
        const sch = schemeText(eff);
        return (
          <Pressable key={e.rdeId} style={[styles.card, isDone && styles.cardDone]} onPress={() => setOpenItem(eff)}>
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={isDone ? theme.good : theme.textMuted}
            />
            <View style={styles.exMain}>
              <Text style={styles.exName}>{eff.exercise.name}</Text>
              <Text style={styles.exMeta}>{isDone ? `${count} series hechas` : sch ? `Objetivo ${sch}` : 'Toca para registrar'}</Text>
              {subs[e.rdeId] && <Text style={styles.exMeta}>Hoy en lugar de {e.exercise.name}</Text>}
            </View>
            <Pressable hitSlop={8} onPress={() => setSubFor(e)}>
              <Ionicons name="swap-horizontal" size={20} color={theme.textMuted} />
            </Pressable>
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

      {subFor && (
        <SubstituteSheet
          visible={subFor != null}
          exerciseName={subFor.exercise.name}
          onPick={(ex) => {
            const item = subFor;
            setSubFor(null);
            Alert.alert(`Cambiar por ${ex.name}`, '¿Solo por hoy o siempre (cambia tu rutina)?', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Solo hoy',
                onPress: async () => {
                  const next = { ...subs, [item.rdeId]: ex };
                  setSubs(next);
                  const map: Record<number, number> = {};
                  for (const [k, v] of Object.entries(next)) map[Number(k)] = v.id;
                  await setSetting('sessionSubs', JSON.stringify({ date: today(), dayId, map }));
                },
              },
              {
                text: 'Siempre',
                onPress: async () => {
                  const prof = await getProfile();
                  const sc = defaultScheme(ex.name, (prof?.level ?? 'intermedio') as Level);
                  await replaceDayExercise(item.rdeId, ex.id, { targetSets: sc.sets, repMin: sc.repMin, repMax: sc.repMax });
                  // Limpiar cualquier sustitución "solo hoy" previa para que no tape el cambio permanente.
                  const next = { ...subs };
                  delete next[item.rdeId];
                  setSubs(next);
                  const map: Record<number, number> = {};
                  for (const [k, v] of Object.entries(next)) map[Number(k)] = v.id;
                  await setSetting('sessionSubs', JSON.stringify({ date: today(), dayId, map }));
                  load();
                },
              },
            ]);
          }}
          onClose={() => setSubFor(null)}
        />
      )}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, paddingBottom: 28, gap: 10 },
    back: { color: c.accent, fontWeight: '700' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
