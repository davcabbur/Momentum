import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { getProfile, setLevel } from '@/db/bodyweight-repo';
import { seedExercisesIfEmpty } from '@/db/exercise-repo';
import {
  addExerciseToDay,
  createRoutineFromTemplate,
  getActiveRoutine,
  listDayExercises,
  listDays,
  removeExerciseFromDay,
  type DayExercise,
  type RoutineDay,
} from '@/db/routine-repo';
import { schemeForLevel, type Level } from '@/training/levels';
import { DAYS_PER_WEEK_OPTIONS, routineTemplatesFor, type RoutineTemplate } from '@/training/routine-templates';
import { ExercisePicker } from '@/ui/ExercisePicker';
import { SchemeEditSheet } from '@/ui/SchemeEditSheet';

const LEVELS = ['principiante', 'intermedio', 'avanzado'];

export function RoutineBuilder({ onDone }: { onDone: () => void }) {
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [exByDay, setExByDay] = useState<Record<number, DayExercise[]>>({});
  const [level, setLvl] = useState('intermedio');
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [forceChoose, setForceChoose] = useState(false);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [editEx, setEditEx] = useState<DayExercise | null>(null);

  const lvlScheme = schemeForLevel(level as Level);

  const load = useCallback(async () => {
    await seedExercisesIfEmpty();
    const r = await getActiveRoutine();
    const ds = r ? await listDays(r.id) : [];
    setDays(Array.isArray(ds) ? ds : []);
    const map: Record<number, DayExercise[]> = {};
    for (const d of ds) map[d.id] = await listDayExercises(d.id);
    setExByDay(map);
    const prof = await getProfile();
    if (prof?.level) setLvl(prof.level);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const choosing = days.length === 0 || forceChoose;

  async function pickLevel(l: string) {
    setLvl(l);
    await setLevel(l);
  }

  async function pickTemplate(t: RoutineTemplate) {
    await createRoutineFromTemplate(t, level as Level);
    setForceChoose(false);
    setDaysPerWeek(null);
    load();
  }

  function schemeText(x: DayExercise): string {
    const sets = x.targetSets ?? lvlScheme.sets;
    const lo = x.repMin ?? lvlScheme.repMin;
    const hi = x.repMax ?? lvlScheme.repMax;
    return `${sets}×${lo}–${hi}`;
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

      {choosing ? (
        <>
          <Text style={styles.lbl}>¿Cuántos días entrenas a la semana?</Text>
          <View style={styles.chips}>
            {DAYS_PER_WEEK_OPTIONS.map((n) => (
              <Pressable key={n} style={[styles.chip, daysPerWeek === n && styles.chipOn]} onPress={() => setDaysPerWeek(n)}>
                <Text style={[styles.chipTxt, daysPerWeek === n && styles.chipTxtOn]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          {daysPerWeek != null && (
            <>
              <Text style={styles.lbl}>Elige una rutina (se rellenan los ejercicios)</Text>
              {routineTemplatesFor(daysPerWeek).map((t) => (
                <Pressable key={t.key} style={styles.tpl} onPress={() => pickTemplate(t)}>
                  <Text style={styles.tplName}>{t.name}</Text>
                  <Text style={styles.tplDays}>{t.days.map((d) => d.name).join(' · ')}</Text>
                </Pressable>
              ))}
            </>
          )}

          {forceChoose && days.length > 0 && (
            <Pressable style={styles.cancel} onPress={() => { setForceChoose(false); setDaysPerWeek(null); }}>
              <Text style={styles.cancelTxt}>Cancelar</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <Text style={styles.lbl}>Tus días (toca un ejercicio para ajustar series/reps)</Text>
          {days.map((d) => (
            <View key={d.id} style={styles.dayBox}>
              <Text style={styles.dayName}>{d.name}</Text>
              {(exByDay[d.id] ?? []).map((x) => (
                <View key={x.rdeId} style={styles.exRow}>
                  <Pressable style={styles.exMain} onPress={() => setEditEx(x)}>
                    <Text style={styles.exName}>{x.exercise.name}</Text>
                    <Text style={styles.exScheme}>{schemeText(x)}</Text>
                  </Pressable>
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
          <Pressable style={styles.change} onPress={() => setForceChoose(true)}>
            <Text style={styles.changeTxt}>Cambiar rutina (días/plantilla)</Text>
          </Pressable>
        </>
      )}

      <ExercisePicker
        visible={pickerDay != null}
        onPick={async (exId) => {
          if (pickerDay != null) {
            await addExerciseToDay(pickerDay, exId, { targetSets: lvlScheme.sets, repMin: lvlScheme.repMin, repMax: lvlScheme.repMax });
          }
          setPickerDay(null);
          load();
        }}
        onClose={() => setPickerDay(null)}
      />

      {editEx && (
        <SchemeEditSheet
          visible={editEx != null}
          rdeId={editEx.rdeId}
          name={editEx.exercise.name}
          sets={editEx.targetSets ?? lvlScheme.sets}
          repMin={editEx.repMin ?? lvlScheme.repMin}
          repMax={editEx.repMax ?? lvlScheme.repMax}
          onClose={() => { setEditEx(null); load(); }}
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
  lbl: { color: Brand.textMuted, fontSize: 12, textTransform: 'uppercase', marginTop: 8 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', minWidth: 44 },
  chipOn: { borderColor: Brand.accentStrong, backgroundColor: '#241f3a' },
  chipTxt: { color: Brand.textMuted, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  chipTxtOn: { color: Brand.text },
  tpl: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14 },
  tplName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  tplDays: { color: Brand.textMuted, fontSize: 12, marginTop: 3 },
  cancel: { padding: 10, alignItems: 'center' },
  cancelTxt: { color: Brand.textMuted },
  dayBox: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  dayName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Brand.cardBorder },
  exMain: { flex: 1 },
  exName: { color: Brand.text },
  exScheme: { color: Brand.accent, fontSize: 12, marginTop: 1 },
  del: { color: '#f87171', fontSize: 12, marginLeft: 8 },
  addEx: { paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Brand.cardBorder, borderStyle: 'dashed', borderRadius: 10, marginTop: 4 },
  addExTxt: { color: Brand.accent, fontSize: 13, fontWeight: '600' },
  change: { padding: 12, alignItems: 'center', marginTop: 4 },
  changeTxt: { color: Brand.textMuted },
});
