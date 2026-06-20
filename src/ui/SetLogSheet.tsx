import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, AppState, Modal, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import Body from 'react-native-body-highlighter';

import { Brand } from '@/constants/theme';
import { computeTrend } from '@/bodyweight/trend';
import { GLOSSARY } from '@/education/glossary';
import { getProfile, listWeights } from '@/db/bodyweight-repo';
import { deleteSet, exerciseE1rmHistory, getLastPerformance, getOrCreateSession, listSets, upsertSet, type SetLog } from '@/db/workout-repo';
import { muscleView } from '@/training/muscle-map';
import { exerciseInfo } from '@/training/exercise-info';
import { exerciseMeta, isBodyweightLoaded } from '@/training/exercise-meta';
import { schemeForLevel, type Level } from '@/training/levels';
import { progressionHint, type ProgressionHint } from '@/training/progression';
import { detectStall } from '@/training/intelligence';
import { cancelScheduledNotification, scheduleRestDoneNotification } from '@/lib/notifications';
import { recommendedRestSeconds } from '@/training/rest';
import { exerciseSetWarning } from '@/training/volume';

function mmss(secs: number): string {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function showTerm(key: string) {
  const t = GLOSSARY.find((g) => g.key === key);
  if (t) Alert.alert(t.title, t.body);
}

function showTipos() {
  const top = GLOSSARY.find((g) => g.key === 'topset')?.body ?? '';
  const back = GLOSSARY.find((g) => g.key === 'backoff')?.body ?? '';
  Alert.alert('Tipos de serie', `Top set: ${top}\n\nBack-off: ${back}\n\nCalent.: serie suave de aproximación; no cuenta para el volumen.`);
}

const RIRS = [0, 1, 2, 3, 4];
const TYPES = [
  { key: 'normal', label: 'Normal' },
  { key: 'top', label: 'Top set' },
  { key: 'backoff', label: 'Back-off' },
  { key: 'warmup', label: 'Calent.' },
];

interface Props {
  visible: boolean;
  sessionId: number | null;
  dayId: number;
  date: string;
  exerciseId: number;
  exerciseName: string;
  muscleGroup?: string;
  targetSets?: number | null;
  repMin?: number | null;
  repMax?: number | null;
  onSessionCreated?: (id: number) => void;
  onClose: () => void;
}

type Editing = { setNumber: number; weightKg: number; reps: number; rir: number | null; setType: string; exists: boolean };

export function SetLogSheet({ visible, sessionId, dayId, date, exerciseId, exerciseName, muscleGroup, targetSets, repMin, repMax, onSessionCreated, onClose }: Props) {
  const [sid, setSid] = useState<number | null>(sessionId);
  const [sets, setSets] = useState<SetLog[]>([]);
  const [last, setLast] = useState<{ date: string; sets: SetLog[] } | null>(null);
  const [target, setTarget] = useState('');
  const [schemeSets, setSchemeSets] = useState(3);
  const [hint, setHint] = useState<ProgressionHint | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [restGoal, setRestGoal] = useState(120);
  const [restEnd, setRestEnd] = useState<number | null>(null); // hora de fin (ms); fuente de verdad
  const [restLeft, setRestLeft] = useState(0); // segundos mostrados, derivados de restEnd
  const [bodyweight, setBodyweight] = useState<number | null>(null);
  const [deload, setDeload] = useState<{ sessions: number; weight: number | null } | null>(null);
  const restRunning = useRef(false);
  const restNotifId = useRef<string | null>(null);

  const info = exerciseInfo(exerciseName);
  const mv = muscleView(muscleGroup ?? '');
  const bwLoaded = isBodyweightLoaded(exerciseName);
  const isCompound = exerciseMeta(exerciseName)?.compound ?? false;
  // Tipo de serie por defecto: en compuestos, 1ª = top set, resto = back-off; aislamiento = normal.
  const defaultType = (n: number) => (isCompound ? (n === 1 ? 'top' : 'backoff') : 'normal');
  const workSets = sets.filter((s) => s.setType !== 'warmup').length;
  const volWarn = exerciseSetWarning(workSets, schemeSets);

  const load = useCallback(async () => {
    if (!visible || !exerciseId) return;
    const fetched = sid != null ? await listSets(sid, exerciseId) : [];
    setSets(fetched);
    const lp = await getLastPerformance(exerciseId, sid ?? -1);
    setLast(lp);
    const ws = await listWeights();
    const tr = computeTrend(ws);
    const bw = tr.length ? Math.round(tr[tr.length - 1].trendKg) : null;
    setBodyweight(bw);
    const prof = await getProfile();
    const lvl = (prof?.level as Level) ?? 'intermedio';
    const sc = schemeForLevel(lvl);
    const setsN = targetSets ?? sc.sets;
    const lo = repMin ?? sc.repMin;
    const hi = repMax ?? sc.repMax;
    const rir = sc.rirMin === sc.rirMax ? `${sc.rirMin}` : `${sc.rirMin}–${sc.rirMax}`;
    setSchemeSets(setsN);
    setTarget(`${setsN}×${lo}–${hi} · RIR ${rir}`);
    setRestGoal(recommendedRestSeconds(hi));
    const h = lp ? progressionHint(lp.sets, { sets: setsN, repMin: lo, repMax: hi }) : null;
    setHint(h);
    // Estancamiento → ofrecer descarga (deload) esta sesión.
    const e1rms = await exerciseE1rmHistory(exerciseId);
    const stall = detectStall(e1rms);
    if (stall.stalled && !h?.ready) {
      const work = (lp?.sets ?? []).filter((s) => s.setType !== 'warmup');
      const maxW = work.length ? Math.max(...work.map((s) => s.weightKg)) : 0;
      const weight = !bwLoaded && maxW > 0 ? Math.round((maxW * 0.9) / 2.5) * 2.5 : null;
      setDeload({ sessions: stall.sessionsSincePR, weight });
    } else {
      setDeload(null);
    }
    // Serie 1 ya abierta para anotar al entrar. Si toca subir peso, pre-rellena lo sugerido.
    if (fetched.length === 0) {
      const prev = lp?.sets[0];
      const up = h?.ready && h.suggestedWeightKg != null;
      const base = bwLoaded ? bw ?? 20 : 20;
      setEditing({
        setNumber: 1,
        weightKg: up ? h!.suggestedWeightKg! : prev?.weightKg ?? base,
        reps: up ? lo : prev?.reps ?? 8,
        rir: 2,
        setType: defaultType(1),
        exists: false,
      });
    }
  }, [visible, sid, exerciseId, targetSets, repMin, repMax]);

  // Al (re)abrir para un ejercicio, sincroniza la sesión con la del padre.
  useEffect(() => {
    setSid(sessionId);
  }, [sessionId, exerciseId, visible]);

  useEffect(() => {
    load();
  }, [load]);

  // Cuenta atrás del descanso: se deriva de la hora de fin (restEnd) usando el reloj
  // real, así no se desfasa al bloquear el móvil o cambiar de app (el hilo JS se pausa
  // en segundo plano). Al volver a primer plano se recalcula al instante con AppState.
  useEffect(() => {
    if (restEnd == null) {
      setRestLeft(0);
      return;
    }
    const update = () => {
      const left = Math.max(0, Math.round((restEnd - Date.now()) / 1000));
      setRestLeft(left);
      if (left <= 0) setRestEnd(null);
    };
    update();
    const id = setInterval(update, 500);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') update();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [restEnd]);

  // Vibra una vez al terminar el descanso.
  useEffect(() => {
    if (restLeft > 0) {
      restRunning.current = true;
    } else if (restRunning.current) {
      restRunning.current = false;
      Vibration.vibrate(500);
    }
  }, [restLeft]);

  // Aviso del sistema para cuando termine el descanso: lo dispara Android aunque la app
  // esté en segundo plano o el móvil bloqueado. Se reprograma al cambiar restEnd (+30s) y
  // se cancela al saltar o al terminar en primer plano (cuando restEnd se pone a null).
  useEffect(() => {
    if (restEnd == null) return;
    let cancelled = false;
    const secs = Math.round((restEnd - Date.now()) / 1000);
    scheduleRestDoneNotification(secs).then((id) => {
      if (cancelled) {
        if (id) cancelScheduledNotification(id);
      } else {
        restNotifId.current = id;
      }
    });
    return () => {
      cancelled = true;
      if (restNotifId.current) {
        cancelScheduledNotification(restNotifId.current);
        restNotifId.current = null;
      }
    };
  }, [restEnd]);

  function openNew() {
    const n = sets.length + 1;
    const lastSame = last?.sets.find((s) => s.setNumber === n);
    const todayPrev = sets[sets.length - 1];
    const up = hint?.ready && hint.suggestedWeightKg != null && !todayPrev;
    const base = bwLoaded ? bodyweight ?? 20 : 20;
    setEditing({
      setNumber: n,
      weightKg: up ? hint!.suggestedWeightKg! : lastSame?.weightKg ?? todayPrev?.weightKg ?? base,
      reps: lastSame?.reps ?? todayPrev?.reps ?? 8,
      rir: 2,
      setType: lastSame?.setType ?? defaultType(n),
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
    let cur = sid;
    if (cur == null) {
      cur = await getOrCreateSession(date, dayId);
      setSid(cur);
      onSessionCreated?.(cur);
    }
    await upsertSet({
      sessionId: cur,
      exerciseId,
      setNumber: editing.setNumber,
      weightKg: editing.weightKg,
      reps: editing.reps,
      rir: editing.rir,
      setType: editing.setType,
    });
    const wasWarmup = editing.setType === 'warmup';
    setEditing(null);
    if (!wasWarmup) setRestEnd(Date.now() + restGoal * 1000);
    setSets(await listSets(cur, exerciseId));
  }

  async function removeSet() {
    if (!editing || sid == null) return;
    const existing = sets.find((s) => s.setNumber === editing.setNumber);
    if (existing) await deleteSet(existing.id);
    setEditing(null);
    setSets(await listSets(sid, exerciseId));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.target}>🎯 {target}</Text>
            {bwLoaded && (
              <Text style={styles.bwNote}>
                El peso incluye tu peso corporal{bodyweight ? ` (~${bodyweight} kg)` : ''}. Súbelo si usas lastre.
              </Text>
            )}

            {/* Técnica (mapa muscular + cómo hacerlo), plegado por defecto. */}
            {(mv || info) && (
              <View style={styles.howBox}>
                <Pressable style={styles.howHead} onPress={() => setShowHow((v) => !v)}>
                  <Text style={styles.howTitle}>Cómo hacerlo {muscleGroup ? `· ${muscleGroup}` : ''}</Text>
                  <Ionicons name={showHow ? 'chevron-up' : 'chevron-down'} size={16} color={Brand.accent} />
                </Pressable>
                {showHow && (
                  <>
                    {mv && (
                      <View style={styles.bodyBox}>
                        <Body data={[{ slug: mv.slug, intensity: 1 }]} side={mv.side} gender="male" colors={[Brand.accent]} defaultFill="#2e2e3a" border="none" scale={0.5} />
                      </View>
                    )}
                    {info?.howTo.map((cue, i) => (
                      <Text key={i} style={styles.cue}>
                        • {cue}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}
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

            {deload && (
              <View style={styles.deloadBox}>
                <Text style={styles.deloadTxt}>
                  🔋 {deload.sessions} sesiones sin batir tu marca. Buen momento para una descarga:{' '}
                  {deload.weight != null
                    ? `baja a ~${String(deload.weight).replace('.', ',')} kg y`
                    : 'baja algo el peso o quita una serie y'}{' '}
                  sube el RIR a 3. Volverás más fuerte.
                </Text>
                {deload.weight != null && (
                  <Pressable style={styles.deloadBtn} onPress={() => setEditing((e) => (e ? { ...e, weightKg: deload.weight!, rir: 3 } : e))}>
                    <Text style={styles.deloadBtnTxt}>Aplicar descarga</Text>
                  </Pressable>
                )}
              </View>
            )}

            {restLeft > 0 && (
              <View style={styles.restBox}>
                <Ionicons name="timer-outline" size={20} color={Brand.good} />
                <Text style={styles.restTime}>Descanso {mmss(restLeft)}</Text>
                <Pressable style={styles.restBtn} onPress={() => setRestEnd((e) => (e ?? Date.now()) + 30000)}>
                  <Text style={styles.restBtnTxt}>+30s</Text>
                </Pressable>
                <Pressable style={styles.restBtn} onPress={() => { restRunning.current = false; setRestEnd(null); }}>
                  <Text style={styles.restBtnTxt}>Saltar</Text>
                </Pressable>
              </View>
            )}

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
                <Pressable style={styles.lblRow} onPress={() => showTerm('rir')}>
                  <Text style={styles.lbl}>RIR</Text>
                  <Ionicons name="information-circle-outline" size={14} color={Brand.accent} />
                </Pressable>
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
                <Pressable style={styles.lblRow} onPress={showTipos}>
                  <Text style={styles.lbl}>Tipo de serie</Text>
                  <Ionicons name="information-circle-outline" size={14} color={Brand.accent} />
                </Pressable>
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
  bwNote: { color: Brand.info, fontSize: 12, marginTop: 4, lineHeight: 17 },
  hint: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  hintReady: { color: Brand.good, fontWeight: '700' },
  warn: { color: '#fbbf24', fontSize: 12, marginTop: 6, lineHeight: 18 },
  deloadBox: { backgroundColor: '#2a2412', borderColor: '#5c4d1e', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8, gap: 8 },
  deloadTxt: { color: '#fbbf24', fontSize: 12, lineHeight: 18 },
  deloadBtn: { backgroundColor: '#5c4d1e', borderRadius: 9, paddingVertical: 8, alignItems: 'center' },
  deloadBtnTxt: { color: '#fde68a', fontWeight: '800', fontSize: 13 },
  restBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#15251c', borderRadius: 12, padding: 12, marginTop: 8 },
  restTime: { color: Brand.good, fontSize: 16, fontWeight: '800', flex: 1 },
  restBtn: { backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 9, paddingVertical: 6, paddingHorizontal: 12 },
  restBtnTxt: { color: Brand.text, fontWeight: '700', fontSize: 12 },
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
  lbl: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase' },
  lblRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
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
