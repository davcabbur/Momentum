import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { getProfile, setLevel } from '@/db/bodyweight-repo';
import {
  addDay,
  addExerciseToDay,
  createRoutine,
  deleteDay,
  getActiveRoutine,
  listDayExercises,
  listDays,
  removeExerciseFromDay,
  type Exercise,
  type RoutineDay,
} from '@/db/routine-repo';
import { ExercisePicker } from '@/ui/ExercisePicker';

const LEVELS = ['principiante', 'intermedio', 'avanzado'];

export function RoutineBuilder({ onDone }: { onDone: () => void }) {
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [exByDay, setExByDay] = useState<Record<number, { rdeId: number; exercise: Exercise }[]>>({});
  const [level, setLvl] = useState('intermedio');
  const [newDay, setNewDay] = useState('');
  const [pickerDay, setPickerDay] = useState<number | null>(null);

  const load = useCallback(async () => {
    let r = await getActiveRoutine();
    if (!r) {
      const id = await createRoutine('Mi rutina');
      r = { id, name: 'Mi rutina' };
    }
    setRoutineId(r.id);
    const ds = await listDays(r.id);
    setDays(ds);
    const map: Record<number, { rdeId: number; exercise: Exercise }[]> = {};
    for (const d of ds) map[d.id] = await listDayExercises(d.id);
    setExByDay(map);
    const prof = await getProfile();
    if (prof?.level) setLvl(prof.level);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function pickLevel(l: string) {
    setLvl(l);
    await setLevel(l);
  }

  async function onAddDay() {
    if (routineId && newDay.trim()) {
      await addDay(routineId, newDay.trim());
      setNewDay('');
      load();
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onDone}>
        <Text style={styles.back}>‹ Hecho</Text>
      </Pressable>
      <Text style={styles.h1}>Tu rutina</Text>

      <Text style={styles.lbl}>Tu nivel</Text>
      <View style={styles.chips}>
        {LEVELS.map((l) => (
          <Pressable key={l} style={[styles.chip, level === l && styles.chipOn]} onPress={() => pickLevel(l)}>
            <Text style={[styles.chipTxt, level === l && styles.chipTxtOn]}>{l[0].toUpperCase() + l.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.lbl}>Días</Text>
      {days.map((d) => (
        <View key={d.id} style={styles.dayBox}>
          <View style={styles.dayHead}>
            <Text style={styles.dayName}>{d.name}</Text>
            <Pressable onPress={async () => { await deleteDay(d.id); load(); }}>
              <Text style={styles.del}>borrar</Text>
            </Pressable>
          </View>
          {(exByDay[d.id] ?? []).map((x) => (
            <View key={x.rdeId} style={styles.exRow}>
              <Text style={styles.exName}>{x.exercise.name}</Text>
              <Pressable onPress={async () => { await removeExerciseFromDay(x.rdeId); load(); }}>
                <Text style={styles.del}>quitar</Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addEx} onPress={() => setPickerDay(d.id)}>
            <Text style={styles.addExTxt}>＋ Ejercicio</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.addDayRow}>
        <TextInput
          value={newDay}
          onChangeText={setNewDay}
          placeholder="Nombre del día (Empuje, Día A…)"
          placeholderTextColor={Brand.textMuted}
          style={styles.input}
        />
        <Pressable style={styles.addDayBtn} onPress={onAddDay}>
          <Text style={styles.addDayTxt}>＋</Text>
        </Pressable>
      </View>

      <ExercisePicker
        visible={pickerDay != null}
        onPick={async (exId) => {
          if (pickerDay != null) await addExerciseToDay(pickerDay, exId);
          setPickerDay(null);
          load();
        }}
        onClose={() => setPickerDay(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 10 },
  back: { color: Brand.accent, fontWeight: '700' },
  h1: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  lbl: { color: Brand.textMuted, fontSize: 12, textTransform: 'uppercase', marginTop: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  chipOn: { borderColor: Brand.accentStrong, backgroundColor: '#241f3a' },
  chipTxt: { color: Brand.textMuted, fontWeight: '700', fontSize: 12 },
  chipTxtOn: { color: Brand.text },
  dayBox: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  del: { color: '#f87171', fontSize: 12 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Brand.cardBorder },
  exName: { color: Brand.text },
  addEx: { paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Brand.cardBorder, borderStyle: 'dashed', borderRadius: 10, marginTop: 4 },
  addExTxt: { color: Brand.accent, fontSize: 13, fontWeight: '600' },
  addDayRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  input: { flex: 1, color: Brand.text, backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  addDayBtn: { width: 48, height: 48, borderRadius: 10, backgroundColor: Brand.accentStrong, alignItems: 'center', justifyContent: 'center' },
  addDayTxt: { color: '#fff', fontSize: 22, fontWeight: '700' },
});
