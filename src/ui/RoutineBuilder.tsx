import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { getProfile, setLevel } from '@/db/bodyweight-repo';
import { seedExercises } from '@/db/exercise-repo';
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
import { defaultScheme } from '@/training/default-scheme';
import { schemeForLevel, type Level } from '@/training/levels';
import { DAYS_PER_WEEK_OPTIONS, routineTemplatesFor, type RoutineTemplate } from '@/training/routine-templates';
import { muscleVolumeStatus, weeklyMuscleVolume } from '@/training/volume';
import { shoulderOverlapAdvice } from '@/training/intelligence';
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
  const [menuEx, setMenuEx] = useState<DayExercise | null>(null);

  const lvlScheme = schemeForLevel(level as Level);

  const load = useCallback(async () => {
    await seedExercises();
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

  // Volumen semanal planificado por músculo (principal entero + secundarios a medias).
  const volItems = days.flatMap((d) =>
    (exByDay[d.id] ?? []).map((x) => ({
      name: x.exercise.name,
      muscleGroup: x.exercise.muscleGroup,
      targetSets: x.targetSets ?? lvlScheme.sets,
    })),
  );
  const weeklyByMuscle = weeklyMuscleVolume(volItems);
  const muscleRows = Object.entries(weeklyByMuscle)
    .map(([muscle, sets]) => ({ muscle, sets, status: muscleVolumeStatus(muscle, sets) }))
    .sort((a, b) => b.sets - a.sets);
  const fmtSets = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(1).replace('.', ','));

  const STATUS_COLOR: Record<string, string> = { ok: Brand.textMuted, info: Brand.accent, warn: '#fbbf24' };

  const shoulderAdvice = shoulderOverlapAdvice(
    days.map((d) => ({
      name: d.name,
      exercises: (exByDay[d.id] ?? []).map((x) => ({ muscleGroup: x.exercise.muscleGroup, pattern: x.exercise.pattern })),
    })),
  );

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
                <Pressable key={x.rdeId} style={styles.exRow} onPress={() => setMenuEx(x)}>
                  <View style={styles.exMain}>
                    <Text style={styles.exName}>{x.exercise.name}</Text>
                    <Text style={styles.exScheme}>{schemeText(x)}</Text>
                  </View>
                  <Text style={styles.exMore}>⋯</Text>
                </Pressable>
              ))}
              <Pressable style={styles.addEx} onPress={() => setPickerDay(d.id)}>
                <Text style={styles.addExTxt}>＋ Ejercicio</Text>
              </Pressable>
            </View>
          ))}
          {shoulderAdvice && (
            <View style={styles.shoulderBox}>
              <Text style={styles.shoulderTxt}>🤚 {shoulderAdvice.text}</Text>
            </View>
          )}

          {muscleRows.length > 0 && (
            <View style={styles.volBox}>
              <Text style={styles.volTitle}>Volumen semanal por músculo</Text>
              <Text style={styles.volIntro}>Series objetivo a la semana. Orienta, no presiona.</Text>
              {muscleRows.map((r) => (
                <View key={r.muscle} style={styles.volItem}>
                  <View style={styles.volHead}>
                    <Text style={styles.volMuscle}>{r.muscle[0].toUpperCase() + r.muscle.slice(1)}</Text>
                    <Text style={[styles.volSets, { color: STATUS_COLOR[r.status.level] }]}>{fmtSets(r.sets)} series</Text>
                  </View>
                  {r.status.level !== 'ok' && (
                    <Text style={[styles.volNote, { color: STATUS_COLOR[r.status.level] }]}>{r.status.text}</Text>
                  )}
                </View>
              ))}
              <Text style={styles.volFoot}>Los compuestos suman entero a su músculo principal y a medias a los secundarios; es una guía aproximada.</Text>
            </View>
          )}

          <Pressable style={styles.change} onPress={() => setForceChoose(true)}>
            <Text style={styles.changeTxt}>Cambiar rutina (días/plantilla)</Text>
          </Pressable>
        </>
      )}

      <ExercisePicker
        visible={pickerDay != null}
        onPick={async (ex) => {
          if (pickerDay != null) {
            const sc = defaultScheme(ex.name, level as Level);
            await addExerciseToDay(pickerDay, ex.id, { targetSets: sc.sets, repMin: sc.repMin, repMax: sc.repMax });
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

      {menuEx && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setMenuEx(null)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuEx(null)}>
            <Pressable style={styles.menu} onPress={() => {}}>
              <Text style={styles.menuTitle}>{menuEx.exercise.name}</Text>
              <Pressable style={styles.menuBtn} onPress={() => { setEditEx(menuEx); setMenuEx(null); }}>
                <Text style={styles.menuBtnTxt}>Editar series/reps</Text>
              </Pressable>
              <Pressable
                style={styles.menuBtn}
                onPress={async () => {
                  const id = menuEx.rdeId;
                  setMenuEx(null);
                  await removeExerciseFromDay(id);
                  load();
                }}>
                <Text style={[styles.menuBtnTxt, { color: '#f87171' }]}>Quitar ejercicio</Text>
              </Pressable>
              <Pressable style={styles.menuCancel} onPress={() => setMenuEx(null)}>
                <Text style={styles.menuCancelTxt}>Cancelar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
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
  volBox: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8, marginTop: 4 },
  volTitle: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  volIntro: { color: Brand.textMuted, fontSize: 12 },
  volItem: { gap: 2 },
  volHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  volMuscle: { color: Brand.text, fontSize: 14 },
  volSets: { fontSize: 13, fontWeight: '700' },
  volNote: { fontSize: 12, lineHeight: 17 },
  volFoot: { color: Brand.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  shoulderBox: { backgroundColor: '#2a2412', borderColor: '#5c4d1e', borderWidth: 1, borderRadius: 14, padding: 14 },
  shoulderTxt: { color: '#fbbf24', fontSize: 12, lineHeight: 18 },
  exMore: { color: Brand.textMuted, fontSize: 20, marginLeft: 8, paddingHorizontal: 4 },
  menuBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  menu: { backgroundColor: Brand.card, padding: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 6 },
  menuTitle: { color: Brand.text, fontSize: 16, fontWeight: '800', padding: 8 },
  menuBtn: { padding: 14, borderRadius: 10, backgroundColor: Brand.surface },
  menuBtnTxt: { color: Brand.text, fontSize: 15, fontWeight: '600' },
  menuCancel: { padding: 14, alignItems: 'center' },
  menuCancelTxt: { color: Brand.textMuted },
});
