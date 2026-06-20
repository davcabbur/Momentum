import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { addDays } from '@/bodyweight/goal';
import { computeTrend } from '@/bodyweight/trend';
import { getGoal, getProfile, listWeights, setLevel, setProfile } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { reapplyLevelToRoutine } from '@/db/routine-repo';
import { getSetting, setSetting } from '@/db/settings-repo';
import { cancelReminders, ensureNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { type Level } from '@/training/levels';
import { SetGoalSheet } from '@/ui/SetGoalSheet';
import { useTheme, useThemedStyles, type Theme, type ThemeMode } from '@/ui/theme';
import { useRefresh } from '@/ui/useRefresh';

type Goal = typeof weightGoal.$inferSelect;

const THEMES: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
  { key: 'system', label: 'Automático' },
];

const SEXES = [
  { key: 'male', label: 'Hombre' },
  { key: 'female', label: 'Mujer' },
];
const STAGES = [
  { key: 'definicion', label: 'Déficit calórico', desc: 'Perder grasa' },
  { key: 'normocalorica', label: 'Normocalórica', desc: 'Mantener / recomposición' },
  { key: 'volumen', label: 'Superávit calórico', desc: 'Ganar músculo' },
];
const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentario' },
  { key: 'light', label: 'Ligero' },
  { key: 'moderate', label: 'Moderado' },
  { key: 'high', label: 'Alto' },
  { key: 'very_high', label: 'Muy alto' },
];
const LEVELS = ['principiante', 'intermedio', 'avanzado'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function num(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

export function AjustesScreen() {
  const router = useRouter();
  const { c, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [sex, setSex] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [level, setLvl] = useState('intermedio');
  const [goal, setGoalState] = useState<Goal | null>(null);
  const [trendKg, setTrendKg] = useState(75);
  const [goalSheet, setGoalSheet] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);

  const load = useCallback(async () => {
    const p = await getProfile();
    if (p) {
      setSex(p.sex);
      setAge(p.age != null ? String(p.age) : '');
      setHeight(p.heightCm != null ? String(p.heightCm) : '');
      setActivity(p.activityLevel);
      setStage(p.stage);
      if (p.level) setLvl(p.level);
    }
    setGoalState(await getGoal());
    const ws = await listWeights();
    const tr = computeTrend(ws);
    if (tr.length) setTrendKg(tr[tr.length - 1].trendKg);
    setReminderOn((await getSetting('reminder_on')) === '1');
    const h = await getSetting('reminder_hour');
    setReminderHour(h ? Number(h) : 9);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { control } = useRefresh(load);

  async function saveProfile() {
    if (!sex || !activity || !stage) return;
    await setProfile({
      sex,
      age: Math.round(Number(age)) || 0,
      heightCm: Math.round(num(height)) || 0,
      stage,
      activityLevel: activity,
    });
    setSaved(true);
  }

  async function pickLevel(l: string) {
    setLvl(l);
    await setLevel(l);
  }

  async function toggleReminder(on: boolean) {
    if (on) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert('Permiso necesario', 'Activa las notificaciones del sistema para recibir recordatorios.');
        return;
      }
      await scheduleDailyReminder(reminderHour);
      await setSetting('reminder_on', '1');
      setReminderOn(true);
    } else {
      await cancelReminders();
      await setSetting('reminder_on', '0');
      setReminderOn(false);
    }
  }

  async function changeHour(delta: number) {
    const h = Math.max(5, Math.min(23, reminderHour + delta));
    setReminderHour(h);
    await setSetting('reminder_hour', String(h));
    if (reminderOn) await scheduleDailyReminder(h);
  }

  function confirmReapply() {
    Alert.alert(
      'Recalcular tu rutina',
      `Pondré las series/reps de todos tus ejercicios al esquema de nivel ${level}. Sobreescribe los ajustes manuales que hayas hecho. ¿Seguir?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recalcular',
          onPress: async () => {
            await reapplyLevelToRoutine(level as Level);
            Alert.alert('Listo', 'Tu rutina se ha ajustado a tu nivel.');
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={control}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
          <Ionicons name="chevron-back" size={22} color={c.accent} />
          <Text style={styles.back}>Inicio</Text>
        </Pressable>
      </View>
      <Text style={styles.h1}>Ajustes</Text>

      {/* Perfil */}
      <Text style={styles.section}>Tu perfil</Text>
      <View style={styles.card}>
        <Text style={styles.lbl}>Sexo</Text>
        <View style={styles.row}>
          {SEXES.map((o) => (
            <Pressable key={o.key} style={[styles.pill, sex === o.key && styles.pillOn]} onPress={() => { setSex(o.key); setSaved(false); }}>
              <Text style={[styles.pillTxt, sex === o.key && styles.pillTxtOn]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Edad</Text>
            <TextInput value={age} onChangeText={(v) => { setAge(v); setSaved(false); }} keyboardType="number-pad" placeholder="años" placeholderTextColor={c.textMuted} style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Altura (cm)</Text>
            <TextInput value={height} onChangeText={(v) => { setHeight(v); setSaved(false); }} keyboardType="number-pad" placeholder="cm" placeholderTextColor={c.textMuted} style={styles.input} />
          </View>
        </View>
        <Text style={styles.lbl}>Actividad</Text>
        <View style={styles.wrap}>
          {ACTIVITIES.map((o) => (
            <Pressable key={o.key} style={[styles.chip, activity === o.key && styles.pillOn]} onPress={() => { setActivity(o.key); setSaved(false); }}>
              <Text style={[styles.chipTxt, activity === o.key && styles.pillTxtOn]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.lbl}>Etapa</Text>
        <View style={styles.wrap}>
          {STAGES.map((o) => (
            <Pressable key={o.key} style={[styles.chip, stage === o.key && styles.pillOn]} onPress={() => { setStage(o.key); setSaved(false); }}>
              <Text style={[styles.chipTxt, stage === o.key && styles.pillTxtOn]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.save} onPress={saveProfile}>
          <Text style={styles.saveTxt}>{saved ? 'Guardado ✓' : 'Guardar perfil'}</Text>
        </Pressable>
      </View>

      {/* Objetivo */}
      <Text style={styles.section}>Objetivo de peso</Text>
      <Pressable style={styles.linkRow} onPress={() => setGoalSheet(true)}>
        <Text style={styles.linkTxt}>Editar peso objetivo y fecha</Text>
        <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
      </Pressable>

      {/* Nivel */}
      <Text style={styles.section}>Nivel de entreno</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          {LEVELS.map((l) => (
            <Pressable key={l} style={[styles.pill, level === l && styles.pillOn]} onPress={() => pickLevel(l)}>
              <Text style={[styles.pillTxt, level === l && styles.pillTxtOn]}>{l[0].toUpperCase() + l.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>Tu nivel ajusta el RIR objetivo y las series/reps de los ejercicios nuevos.</Text>
        <Pressable style={styles.secondary} onPress={confirmReapply}>
          <Text style={styles.secondaryTxt}>Recalcular mi rutina a este nivel</Text>
        </Pressable>
      </View>

      {/* Apariencia */}
      <Text style={styles.section}>Apariencia</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <Pressable key={t.key} style={[styles.pill, mode === t.key && styles.pillOn]} onPress={() => setMode(t.key)}>
              <Text style={[styles.pillTxt, mode === t.key && styles.pillTxtOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>«Automático» sigue el tema de tu móvil. Cámbialo a Claro u Oscuro para forzarlo.</Text>
      </View>

      {/* Recordatorios */}
      <Text style={styles.section}>Recordatorios</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLbl}>Recordatorio diario</Text>
          <Switch value={reminderOn} onValueChange={toggleReminder} trackColor={{ true: c.accentStrong, false: c.cardBorder }} />
        </View>
        {reminderOn && (
          <View style={styles.hourRow}>
            <Text style={styles.note}>A las</Text>
            <Pressable style={styles.hourBtn} onPress={() => changeHour(-1)}>
              <Text style={styles.hourBtnTxt}>−</Text>
            </Pressable>
            <Text style={styles.hourVal}>{String(reminderHour).padStart(2, '0')}:00</Text>
            <Pressable style={styles.hourBtn} onPress={() => changeHour(1)}>
              <Text style={styles.hourBtnTxt}>+</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.note}>Un aviso al día para pesarte y registrar tu progreso. Quítalo cuando quieras.</Text>
      </View>

      {/* Glosario */}
      <Text style={styles.section}>Aprende</Text>
      <Pressable style={styles.linkRow} onPress={() => router.push('/glosario')}>
        <Text style={styles.linkTxt}>📖 Glosario de términos</Text>
        <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
      </Pressable>

      <SetGoalSheet
        visible={goalSheet}
        initialTargetKg={goal?.targetKg ?? Math.round(trendKg - 4)}
        initialTargetDate={goal?.targetDate ?? addDays(today(), 84)}
        startKg={goal?.startKg ?? trendKg}
        startDate={goal?.startDate ?? today()}
        canClear={goal !== null}
        onClose={() => {
          setGoalSheet(false);
          load();
        }}
      />
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  content: { padding: 14, gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: c.accent, fontWeight: '700', fontSize: 15 },
  h1: { color: c.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  section: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 10 },
  card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  lbl: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 10 },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { flex: 1, backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  pillOn: { borderColor: c.accentStrong, backgroundColor: c.accentSurface },
  pillTxt: { color: c.textMuted, fontWeight: '700', fontSize: 13 },
  pillTxtOn: { color: c.text },
  chip: { backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  chipTxt: { color: c.textMuted, fontWeight: '700', fontSize: 13 },
  input: { color: c.text, fontSize: 18, fontWeight: '700', backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  save: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  saveTxt: { color: '#fff', fontWeight: '800' },
  secondary: { borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  secondaryTxt: { color: c.accent, fontWeight: '700' },
  note: { color: c.textMuted, fontSize: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLbl: { color: c.text, fontSize: 15, fontWeight: '600' },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hourBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hourBtnTxt: { color: c.accent, fontSize: 22, fontWeight: '700' },
  hourVal: { color: c.text, fontSize: 18, fontWeight: '800', minWidth: 64, textAlign: 'center' },
  linkRow: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkTxt: { color: c.text, fontSize: 15, fontWeight: '600' },
});
