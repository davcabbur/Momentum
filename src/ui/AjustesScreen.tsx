import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { addDays } from '@/bodyweight/goal';
import { computeTrend } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, getProfile, listWeights, setLevel, setProfile } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { reapplyLevelToRoutine } from '@/db/routine-repo';
import { type Level } from '@/training/levels';
import { SetGoalSheet } from '@/ui/SetGoalSheet';

type Goal = typeof weightGoal.$inferSelect;

const SEXES = [
  { key: 'male', label: 'Hombre' },
  { key: 'female', label: 'Mujer' },
];
const STAGES = [
  { key: 'definicion', label: 'Definición', desc: 'Perder grasa' },
  { key: 'normocalorica', label: 'Normocalórica', desc: 'Mantener / recomposición' },
  { key: 'volumen', label: 'Volumen', desc: 'Ganar músculo' },
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
          <Ionicons name="chevron-back" size={22} color={Brand.accent} />
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
            <TextInput value={age} onChangeText={(v) => { setAge(v); setSaved(false); }} keyboardType="number-pad" placeholder="años" placeholderTextColor={Brand.textMuted} style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Altura (cm)</Text>
            <TextInput value={height} onChangeText={(v) => { setHeight(v); setSaved(false); }} keyboardType="number-pad" placeholder="cm" placeholderTextColor={Brand.textMuted} style={styles.input} />
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
        <Ionicons name="chevron-forward" size={18} color={Brand.textMuted} />
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

      {/* Glosario */}
      <Text style={styles.section}>Aprende</Text>
      <Pressable style={styles.linkRow} onPress={() => router.push('/glosario')}>
        <Text style={styles.linkTxt}>📖 Glosario de términos</Text>
        <Ionicons name="chevron-forward" size={18} color={Brand.textMuted} />
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  back: { color: Brand.accent, fontWeight: '700', fontSize: 15 },
  h1: { color: Brand.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  section: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 10 },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  lbl: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 10 },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { flex: 1, backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  pillOn: { borderColor: Brand.accentStrong, backgroundColor: '#241f3a' },
  pillTxt: { color: Brand.textMuted, fontWeight: '700', fontSize: 13 },
  pillTxtOn: { color: Brand.text },
  chip: { backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  chipTxt: { color: Brand.textMuted, fontWeight: '700', fontSize: 13 },
  input: { color: Brand.text, fontSize: 18, fontWeight: '700', backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  save: { backgroundColor: Brand.accentStrong, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  saveTxt: { color: '#fff', fontWeight: '800' },
  secondary: { borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  secondaryTxt: { color: Brand.accent, fontWeight: '700' },
  note: { color: Brand.textMuted, fontSize: 12 },
  linkRow: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkTxt: { color: Brand.text, fontSize: 15, fontWeight: '600' },
});
