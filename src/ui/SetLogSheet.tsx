import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Body from 'react-native-body-highlighter';

import { Brand } from '@/constants/theme';
import { getProfile } from '@/db/bodyweight-repo';
import { deleteSet, getLastPerformance, listSets, upsertSet, type SetLog } from '@/db/workout-repo';
import { muscleView } from '@/training/muscle-map';
import { exerciseInfo } from '@/training/exercise-info';
import { schemeForLevel, type Level } from '@/training/levels';
import { progressionHint, type ProgressionHint } from '@/training/progression';
import { exerciseSetWarning } from '@/training/volume';

const RIRS = [0, 1, 2, 3, 4];
const TYPES = [
  { key: 'normal', label: 'Normal' },
  { key: 'top', label: 'Top set' },
  { key: 'backoff', label: 'Back-off' },
  { key: 'warmup', label: 'Calent.' },
];

interface Props {
  visible: boolean;
  sessionId: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup?: string;
  targetSets?: number | null;
  repMin?: number | null;
  repMax?: number | null;
  onClose: () => void;
}

type Editing = { setNumber: number; weightKg: number; reps: number; rir: number | null; setType: string; exists: boolean };

export function SetLogSheet({ visible, sessionId, exerciseId, exerciseName, muscleGroup, targetSets, repMin, repMax, onClose }: Props) {
  const [sets, setSets] = useState<SetLog[]>([]);
  const [last, setLast] = useState<{ date: string; sets: SetLog[] } | null>(null);
  const [target, setTarget] = useState('');
  const [schemeSets, setSchemeSets] = useState(3);
  const [hint, setHint] = useState<ProgressionHint | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [showHow, setShowHow] = useState(true);

  const info = exerciseInfo(exerciseName);
  const mv = muscleView(muscleGroup ?? '');
  const workSets = sets.filter((s) => s.setType !== 'warmup').length;
  const volWarn = exerciseSetWarning(workSets, schemeSets);

  const load = useCallback(async () => {
    if (!visible || !exerciseId) return;
    const fetched = await listSets(sessionId, exerciseId);
    setSets(fetched);
    const lp = await getLastPerformance(exerciseId, sessionId);
    setLast(lp);
    const prof = await getProfile();
    const lvl = (prof?.level as Level) ?? 'intermedio';
    const sc = schemeForLevel(lvl);
    const setsN = targetSets ?? sc.sets;
    const lo = repMin ?? sc.repMin;
    const hi = repMax ?? sc.repMax;
    const rir = sc.rirMin === sc.rirMax ? `${sc.rirMin}` : `${sc.rirMin}–${sc.rirMax}`;
    setSchemeSets(setsN);
    setTarget(`${setsN}×${lo}–${hi} · RIR ${rir}`);
    setHint(lp ? progressionHint(lp.sets, { sets: setsN, repMin: lo, repMax: hi }) : null);
    // Serie 1 ya abierta para anotar al entrar.
    if (fetched.length === 0) {
      const prev = lp?.sets[0];
      setEditing({ setNumber: 1, weightKg: prev?.weightKg ?? 20, reps: prev?.reps ?? 8, rir: 2, setType: 'normal', exists: false });
    }
  }, [visible, sessionId, exerciseId, targetSets, repMin, repMax]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    const n = sets.length + 1;
    const lastSame = last?.sets.find((s) => s.setNumber === n);
    const todayPrev = sets[sets.length - 1];
    setEditing({
      setNumber: n,
      weightKg: lastSame?.weightKg ?? todayPrev?.weightKg ?? 20,
      reps: lastSame?.reps ?? todayPrev?.reps ?? 8,
      rir: 2,
      setType: 'normal',
      exists: false,
    });
  }

  function openEdit(s: SetLog) {
    setEditing({ setNumber: s.setNumber, weightKg: s.weightKg, reps: s.reps, rir: s.rir, setType: s.setType, exists: true });
  }

  function step(field: 'weightKg' | 'reps', delta: number) {
    setEditing((e) => (e ? { ...e, [field]: Math.max(0, Number((e[field] + delta).toFixed(1))) } : e));
  }

  async function save() {
    if (!editing) return;
    await upsertSet({
      sessionId,
      exerciseId,
      setNumber: editing.setNumber,
      weightKg: editing.weightKg,
      reps: editing.reps,
      rir: editing.rir,
      setType: editing.setType,
    });
    setEditing(null);
    load();
  }

  async function removeSet() {
    if (!editing) return;
    const existing = sets.find((s) => s.setNumber === editing.setNumber);
    if (existing) await deleteSet(existing.id);
    setEditing(null);
    load();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{exerciseName}</Text>

            {mv ? (
              <View style={styles.bodyBox}>
                <Body
                  data={[{ slug: mv.slug, intensity: 1 }]}
                  side={mv.side}
                  gender="male"
                  colors={[Brand.accent]}
                  defaultFill="#2e2e3a"
                  border="none"
                  scale={0.62}
                />
                <Text style={styles.bodyCaption}>Músculo principal: {muscleGroup}</Text>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="barbell-outline" size={34} color={Brand.textMuted} />
                <Text style={styles.placeholderTxt}>{muscleGroup ?? 'ejercicio'}</Text>
              </View>
            )}

            {info && (
              <View style={styles.howBox}>
                <Pressable style={styles.howHead} onPress={() => setShowHow((v) => !v)}>
                  <Text style={styles.howTitle}>Cómo hacerlo</Text>
                  <Ionicons name={showHow ? 'chevron-up' : 'chevron-down'} size={16} color={Brand.accent} />
                </Pressable>
                {showHow &&
                  info.howTo.map((cue, i) => (
                    <Text key={i} style={styles.cue}>
                      • {cue}
                    </Text>
                  ))}
              </View>
            )}

            <Text style={styles.target}>🎯 {target}</Text>
            {last && (
              <Text style={styles.last}>Última vez: {last.sets.map((s) => `${s.weightKg}×${s.reps}`).join('  ')}</Text>
            )}
            {hint && last && (
              <Text style={[styles.hint, hint.ready && styles.hintReady]}>
                {hint.ready ? '📈 ' : ''}
                {hint.text}
              </Text>
            )}
            {volWarn.level === 'warn' && <Text style={styles.warn}>{volWarn.text}</Text>}

            <View style={styles.head}>
              <Text style={[styles.hCell, { width: 44 }]}>Serie</Text>
              <Text style={[styles.hCell, { flex: 1 }]}>Kg</Text>
              <Text style={[styles.hCell, { flex: 1 }]}>Reps</Text>
              <Text style={[styles.hCell, { width: 50 }]}>RIR</Text>
            </View>
            {sets.map((s) => (
              <Pressable key={s.id} style={styles.row} onPress={() => openEdit(s)}>
                <Text style={[styles.cell, { width: 44, color: Brand.textMuted }]}>{s.setNumber}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{s.weightKg}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{s.reps}</Text>
                <Text style={[styles.cell, { width: 50 }]}>{s.rir ?? '—'}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.addSet} onPress={openNew}>
              <Text style={styles.addSetTxt}>＋ Añadir serie</Text>
            </Pressable>

            {editing && (
              <View style={styles.focus}>
                <Text style={styles.focusTitle}>Serie {editing.setNumber}</Text>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => step('weightKg', -2.5)}>
                    <Text style={styles.stepTxt}>−</Text>
                  </Pressable>
                  <View style={styles.stepVal}>
                    <Text style={styles.stepValTxt}>{editing.weightKg}</Text>
                    <Text style={styles.stepUnit}>kg</Text>
                  </View>
                  <Pressable style={styles.stepBtn} onPress={() => step('weightKg', 2.5)}>
                    <Text style={styles.stepTxt}>+</Text>
                  </Pressable>
                </View>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => step('reps', -1)}>
                    <Text style={styles.stepTxt}>−</Text>
                  </Pressable>
                  <View style={styles.stepVal}>
                    <Text style={styles.stepValTxt}>{editing.reps}</Text>
                    <Text style={styles.stepUnit}>reps</Text>
                  </View>
                  <Pressable style={styles.stepBtn} onPress={() => step('reps', 1)}>
                    <Text style={styles.stepTxt}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.lbl}>RIR</Text>
                <View style={styles.chips}>
                  {RIRS.map((r) => (
                    <Pressable
                      key={r}
                      style={[styles.chip, editing.rir === r && styles.chipOn]}
                      onPress={() => setEditing((e) => (e ? { ...e, rir: r } : e))}>
                      <Text style={[styles.chipTxt, editing.rir === r && styles.chipTxtOn]}>{r === 4 ? '4+' : r}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.lbl}>Tipo de serie</Text>
                <View style={styles.chips}>
                  {TYPES.map((t) => (
                    <Pressable
                      key={t.key}
                      style={[styles.chip, editing.setType === t.key && styles.chipOn]}
                      onPress={() => setEditing((e) => (e ? { ...e, setType: t.key } : e))}>
                      <Text style={[styles.chipTxt, editing.setType === t.key && styles.chipTxtOn]}>{t.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={styles.done} onPress={save}>
                  <Text style={styles.doneTxt}>✓ Serie hecha</Text>
                </Pressable>
                {editing.exists && (
                  <Pressable style={styles.del} onPress={removeSet}>
                    <Text style={styles.delTxt}>Borrar serie</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  sheet: { backgroundColor: Brand.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  title: { color: Brand.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  bodyBox: { backgroundColor: Brand.surface, borderRadius: 12, borderColor: Brand.cardBorder, borderWidth: 1, alignItems: 'center', paddingVertical: 10, gap: 4, marginBottom: 8 },
  bodyCaption: { color: Brand.textMuted, fontSize: 12, textTransform: 'capitalize' },
  imagePlaceholder: { width: '100%', height: 90, borderRadius: 12, backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  placeholderTxt: { color: Brand.textMuted, fontSize: 12, textTransform: 'capitalize' },
  howBox: { backgroundColor: Brand.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 4 },
  howHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  howTitle: { color: Brand.accent, fontSize: 13, fontWeight: '700' },
  cue: { color: Brand.text, fontSize: 13, lineHeight: 19 },
  target: { color: Brand.accent, fontSize: 13, fontWeight: '700', marginTop: 2 },
  last: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  hint: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  hintReady: { color: Brand.good, fontWeight: '700' },
  warn: { color: '#fbbf24', fontSize: 12, marginTop: 6, lineHeight: 18 },
  head: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: 8 },
  hCell: { color: Brand.textMuted, fontSize: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: Brand.surface, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 10, marginTop: 4 },
  cell: { color: Brand.text, fontWeight: '700', textAlign: 'center' },
  addSet: { marginTop: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Brand.cardBorder, borderStyle: 'dashed', borderRadius: 10 },
  addSetTxt: { color: Brand.accent, fontWeight: '700' },
  focus: { marginTop: 12, borderTopWidth: 1, borderTopColor: Brand.cardBorder, paddingTop: 12, gap: 8 },
  focusTitle: { color: Brand.text, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Brand.surface, borderRadius: 12, padding: 8 },
  stepBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Brand.cardBorder, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: Brand.accent, fontSize: 24, fontWeight: '700' },
  stepVal: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  stepValTxt: { color: Brand.text, fontSize: 24, fontWeight: '800' },
  stepUnit: { color: Brand.textMuted, fontSize: 12 },
  lbl: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', marginTop: 4 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center' },
  chipOn: { borderColor: Brand.accentStrong, backgroundColor: '#241f3a' },
  chipTxt: { color: Brand.textMuted, fontWeight: '700', fontSize: 12 },
  chipTxtOn: { color: Brand.text },
  done: { backgroundColor: Brand.good, borderRadius: 12, padding: 14, marginTop: 6 },
  doneTxt: { textAlign: 'center', color: '#06240f', fontWeight: '800' },
  del: { padding: 8 },
  delTxt: { textAlign: 'center', color: '#f87171', fontWeight: '700' },
});
