import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { getProfile, setLevel } from '@/db/bodyweight-repo';
import { seedExercises } from '@/db/exercise-repo';
import {
  addExerciseToDay,
  createRoutineFromTemplate,
  getActiveRoutine,
  listDayExercises,
  listDays,
  moveDayExercise,
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
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [exByDay, setExByDay] = useState<Record<number, DayExercise[]>>({});
  const [level, setLvl] = useState('intermedio');
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [forceChoose, setForceChoose] = useState(false);
  const [step, setStep] = useState(0); // asistente de creación: 0 nivel · 1 días · 2 plantilla
  const [showSummary, setShowSummary] = useState(false);
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
    setStep(0);
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
    (exByDay[d.id] ?? []).map((x) => ({ name: x.exercise.name, muscleGroup: x.exercise.muscleGroup, targetSets: x.targetSets ?? lvlScheme.sets })),
  );
  const muscleRows = Object.entries(weeklyMuscleVolume(volItems))
    .map(([muscle, sets]) => ({ muscle, sets, status: muscleVolumeStatus(muscle, sets) }))
    .sort((a, b) => b.sets - a.sets);
  const fmtSets = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(1).replace('.', ','));
  const STATUS_COLOR: Record<string, string> = { ok: c.textMuted, info: c.accent, warn: c.warn };
  const shoulderAdvice = shoulderOverlapAdvice(
    days.map((d) => ({ name: d.name, exercises: (exByDay[d.id] ?? []).map((x) => ({ muscleGroup: x.exercise.muscleGroup, pattern: x.exercise.pattern })) })),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onDone} hitSlop={8}>
        <Text style={styles.back}>‹ Hecho</Text>
      </Pressable>
      <Text style={styles.h1}>{choosing ? 'Crea tu rutina' : 'Tu rutina'}</Text>

      {choosing ? (
        <>
          <Text style={styles.stepLbl}>Paso {step + 1} de 3</Text>

          {step === 0 && (
            <>
              <Text style={styles.lbl}>Tu nivel</Text>
              <Text style={styles.hint}>Ajusta las series y el RIR recomendados.</Text>
              <View style={styles.chips}>
                {LEVELS.map((l) => (
                  <Pressable key={l} style={[styles.chip, level === l && styles.chipOn]} onPress={() => pickLevel(l)}>
                    <Text style={[styles.chipTxt, level === l && styles.chipTxtOn]}>{l[0].toUpperCase() + l.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.next} onPress={() => setStep(1)}>
                <Text style={styles.nextTxt}>Siguiente →</Text>
              </Pressable>
              {forceChoose && (
                <Pressable style={styles.cancel} onPress={() => { setForceChoose(false); setDaysPerWeek(null); setStep(0); }}>
                  <Text style={styles.cancelTxt}>Cancelar</Text>
                </Pressable>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.lbl}>¿Cuántos días entrenas a la semana?</Text>
              <View style={styles.chips}>
                {DAYS_PER_WEEK_OPTIONS.map((n) => (
                  <Pressable key={n} style={[styles.chip, daysPerWeek === n && styles.chipOn]} onPress={() => setDaysPerWeek(n)}>
                    <Text style={[styles.chipTxt, daysPerWeek === n && styles.chipTxtOn]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.navRow}>
                <Pressable style={styles.backBtn} onPress={() => setStep(0)}>
                  <Text style={styles.backBtnTxt}>Atrás</Text>
                </Pressable>
                <Pressable style={[styles.next, styles.navNext, !daysPerWeek && styles.nextOff]} disabled={!daysPerWeek} onPress={() => setStep(2)}>
                  <Text style={styles.nextTxt}>Siguiente →</Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 2 && daysPerWeek != null && (
            <>
              <Text style={styles.lbl}>Elige tu rutina</Text>
              <Text style={styles.hint}>Te rellenamos los mejores ejercicios; luego puedes ajustarlos.</Text>
              {routineTemplatesFor(daysPerWeek).map((t) => (
                <Pressable key={t.key} style={styles.tpl} onPress={() => pickTemplate(t)}>
                  <Text style={styles.tplName}>{t.name}</Text>
                  <Text style={styles.tplDays}>{t.days.map((d) => d.name).join(' · ')}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnTxt}>Atrás</Text>
              </Pressable>
            </>
          )}
        </>
      ) : (
        <>
          <Text style={styles.hint}>Toca un ejercicio para ajustarlo (series/reps, mover o quitar).</Text>
          {days.map((d) => (
            <View key={d.id} style={styles.dayBox}>
              <Text style={styles.dayName}>{d.name}</Text>
              {(exByDay[d.id] ?? []).map((x) => (
                <Pressable key={x.rdeId} style={styles.exRow} onPress={() => setMenuEx(x)}>
                  <View style={styles.exMain}>
                    <Text style={styles.exName}>{x.exercise.name}</Text>
                    <Text style={styles.exScheme}>{schemeText(x)}</Text>
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
                </Pressable>
              ))}
              <Pressable style={styles.addEx} onPress={() => setPickerDay(d.id)}>
                <Text style={styles.addExTxt}>＋ Ejercicio</Text>
              </Pressable>
            </View>
          ))}

          {/* Resumen de volumen y avisos, plegable. */}
          <Pressable style={styles.summaryToggle} onPress={() => setShowSummary((v) => !v)}>
            <Text style={styles.summaryToggleTxt}>Resumen de volumen y avisos</Text>
            <Ionicons name={showSummary ? 'chevron-up' : 'chevron-down'} size={16} color={c.accent} />
          </Pressable>
          {showSummary && (
            <>
              {shoulderAdvice && (
                <View style={styles.shoulderBox}>
                  <Text style={styles.shoulderTxt}>🤚 {shoulderAdvice.text}</Text>
                </View>
              )}
              {muscleRows.length > 0 && (
                <View style={styles.volBox}>
                  <Text style={styles.volTitle}>Volumen semanal por músculo</Text>
                  {muscleRows.map((r) => (
                    <View key={r.muscle} style={styles.volItem}>
                      <View style={styles.volHead}>
                        <Text style={styles.volMuscle}>{r.muscle[0].toUpperCase() + r.muscle.slice(1)}</Text>
                        <Text style={[styles.volSets, { color: STATUS_COLOR[r.status.level] }]}>{fmtSets(r.sets)} series</Text>
                      </View>
                      {r.status.level !== 'ok' && <Text style={[styles.volNote, { color: STATUS_COLOR[r.status.level] }]}>{r.status.text}</Text>}
                    </View>
                  ))}
                  <Text style={styles.volFoot}>Los compuestos suman entero a su músculo principal y a medias a los secundarios; guía aproximada.</Text>
                </View>
              )}
            </>
          )}

          <Pressable style={styles.change} onPress={() => { setForceChoose(true); setStep(0); }}>
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
              <View style={styles.moveRow}>
                <Pressable style={[styles.menuBtn, styles.moveBtn]} onPress={async () => { const id = menuEx.rdeId; setMenuEx(null); await moveDayExercise(id, -1); load(); }}>
                  <Text style={styles.menuBtnTxt}>↑ Subir</Text>
                </Pressable>
                <Pressable style={[styles.menuBtn, styles.moveBtn]} onPress={async () => { const id = menuEx.rdeId; setMenuEx(null); await moveDayExercise(id, 1); load(); }}>
                  <Text style={styles.menuBtnTxt}>↓ Bajar</Text>
                </Pressable>
              </View>
              <Pressable style={styles.menuBtn} onPress={async () => { const id = menuEx.rdeId; setMenuEx(null); await removeExerciseFromDay(id); load(); }}>
                <Text style={[styles.menuBtnTxt, { color: c.bad }]}>Quitar ejercicio</Text>
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 10 },
    back: { color: c.accent, fontWeight: '700' },
    h1: { color: c.text, fontSize: 22, fontWeight: '800' },
    stepLbl: { color: c.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    lbl: { color: c.text, fontSize: 15, fontWeight: '700', marginTop: 6 },
    hint: { color: c.textMuted, fontSize: 12 },
    chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', minWidth: 44 },
    chipOn: { borderColor: c.accentStrong, backgroundColor: c.accentSurface },
    chipTxt: { color: c.textMuted, fontWeight: '700', fontSize: 13, textAlign: 'center' },
    chipTxtOn: { color: c.text },
    next: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    navNext: { flex: 1, marginTop: 0 },
    nextOff: { opacity: 0.4 },
    nextTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
    navRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
    backBtn: { borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', marginTop: 8 },
    backBtnTxt: { color: c.text, fontWeight: '700' },
    tpl: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14 },
    tplName: { color: c.text, fontSize: 16, fontWeight: '700' },
    tplDays: { color: c.textMuted, fontSize: 12, marginTop: 3 },
    cancel: { padding: 10, alignItems: 'center' },
    cancelTxt: { color: c.textMuted },
    dayBox: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
    dayName: { color: c.text, fontSize: 16, fontWeight: '700' },
    exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.cardBorder },
    exMain: { flex: 1 },
    exName: { color: c.text },
    exScheme: { color: c.accent, fontSize: 12, marginTop: 1 },
    addEx: { paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: c.cardBorder, borderStyle: 'dashed', borderRadius: 10, marginTop: 4 },
    addExTxt: { color: c.accent, fontSize: 13, fontWeight: '600' },
    change: { padding: 12, alignItems: 'center', marginTop: 4 },
    changeTxt: { color: c.textMuted },
    summaryToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 4 },
    summaryToggleTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
    volBox: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
    volTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
    volItem: { gap: 2 },
    volHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    volMuscle: { color: c.text, fontSize: 14 },
    volSets: { fontSize: 13, fontWeight: '700' },
    volNote: { fontSize: 12, lineHeight: 17 },
    volFoot: { color: c.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
    shoulderBox: { backgroundColor: c.warnSurface, borderColor: c.warnBorder, borderWidth: 1, borderRadius: 14, padding: 14 },
    shoulderTxt: { color: c.warn, fontSize: 12, lineHeight: 18 },
    menuBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    menu: { backgroundColor: c.card, padding: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 6 },
    menuTitle: { color: c.text, fontSize: 16, fontWeight: '800', padding: 8 },
    menuBtn: { padding: 14, borderRadius: 10, backgroundColor: c.surface },
    menuBtnTxt: { color: c.text, fontSize: 15, fontWeight: '600' },
    moveRow: { flexDirection: 'row', gap: 6 },
    moveBtn: { flex: 1, alignItems: 'center' },
    menuCancel: { padding: 14, alignItems: 'center' },
    menuCancelTxt: { color: c.textMuted },
  });
