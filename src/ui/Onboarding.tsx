import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDate, parseDmy } from '@/bodyweight/format';
import { Brand } from '@/constants/theme';
import { setProfile, upsertWeight, setGoal } from '@/db/bodyweight-repo';

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
  { key: 'sedentary', label: 'Sedentario', desc: 'Oficina, poco movimiento' },
  { key: 'light', label: 'Ligero', desc: 'De pie a ratos, paseos' },
  { key: 'moderate', label: 'Moderado', desc: 'Entreno 3-4 días o trabajo activo' },
  { key: 'high', label: 'Alto', desc: 'Entreno intenso 5-6 días' },
  { key: 'very_high', label: 'Muy alto', desc: 'Trabajo físico + deporte' },
];

const STEPS = ['Sobre ti', 'Tu peso de hoy', 'Tu objetivo', 'Tu etapa', 'Tu actividad'];

function num(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [dateStr, setDateStr] = useState(formatDate(todayIso));
  const [target, setTarget] = useState('');
  const [stage, setStage] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const valid = [
    sex !== null && Number(age) > 0,
    num(weight) > 0 && parseDmy(dateStr) !== null,
    num(target) > 0,
    stage !== null,
    activity !== null,
  ];
  const canNext = valid[step];
  const isLast = step === STEPS.length - 1;

  async function finish() {
    setSaving(true);
    const iso = parseDmy(dateStr) ?? todayIso;
    const w = num(weight);
    await setProfile({ sex: sex!, age: Math.round(Number(age)), stage: stage!, activityLevel: activity! });
    await upsertWeight(iso, w);
    await setGoal(num(target), w, iso);
    onDone();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>
        Paso {step + 1} de {STEPS.length}
      </Text>
      <Text style={styles.h1}>{STEPS[step]}</Text>

      {step === 0 && (
        <>
          <Text style={styles.label}>Sexo</Text>
          <Text style={styles.help}>Lo usaremos para calcular tus calorías más adelante.</Text>
          <View style={styles.rowOptions}>
            {SEXES.map((o) => (
              <Pressable
                key={o.key}
                style={[styles.pill, sex === o.key && styles.pillOn]}
                onPress={() => setSex(o.key)}>
                <Text style={[styles.pillTxt, sex === o.key && styles.pillTxtOn]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Edad</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="años"
            placeholderTextColor={Brand.textMuted}
            style={styles.input}
          />
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.label}>¿Cuánto pesas hoy? (kg)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="kg"
            placeholderTextColor={Brand.textMuted}
            style={styles.input}
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Fecha de este peso</Text>
          <Text style={styles.help}>Formato DD/MM/AAAA. Por defecto, hoy.</Text>
          <TextInput
            value={dateStr}
            onChangeText={setDateStr}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={Brand.textMuted}
            style={styles.input}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>¿Cuál es tu objetivo de peso? (kg)</Text>
          <Text style={styles.help}>Una guía orientativa; la fecha estimada se recalcula sola con tus pesajes.</Text>
          <TextInput
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            placeholder="kg"
            placeholderTextColor={Brand.textMuted}
            style={styles.input}
          />
        </>
      )}

      {step === 3 && (
        <View style={styles.optionList}>
          {STAGES.map((o) => (
            <Pressable
              key={o.key}
              style={[styles.option, stage === o.key && styles.optionOn]}
              onPress={() => setStage(o.key)}>
              <Text style={styles.optionLabel}>{o.label}</Text>
              <Text style={styles.optionDesc}>{o.desc}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 4 && (
        <View style={styles.optionList}>
          {ACTIVITIES.map((o) => (
            <Pressable
              key={o.key}
              style={[styles.option, activity === o.key && styles.optionOn]}
              onPress={() => setActivity(o.key)}>
              <Text style={styles.optionLabel}>{o.label}</Text>
              <Text style={styles.optionDesc}>{o.desc}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.nav}>
        {step > 0 && (
          <Pressable style={styles.back} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backTxt}>Atrás</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.next, (!canNext || saving) && styles.nextDisabled]}
          disabled={!canNext || saving}
          onPress={() => (isLast ? finish() : setStep((s) => s + 1))}>
          <Text style={styles.nextTxt}>{isLast ? 'Empezar' : 'Siguiente'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 20, gap: 8 },
  kicker: { color: Brand.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  h1: { color: Brand.text, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  label: { color: Brand.text, fontSize: 15, fontWeight: '600' },
  help: { color: Brand.textMuted, fontSize: 12, marginBottom: 4 },
  input: {
    color: Brand.text,
    fontSize: 22,
    fontWeight: '700',
    backgroundColor: Brand.card,
    borderColor: Brand.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  rowOptions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  pill: { flex: 1, backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  pillOn: { borderColor: Brand.accentStrong, backgroundColor: '#241f3a' },
  pillTxt: { color: Brand.textMuted, fontWeight: '700' },
  pillTxtOn: { color: Brand.text },
  optionList: { gap: 10, marginTop: 6 },
  option: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14 },
  optionOn: { borderColor: Brand.accentStrong, backgroundColor: '#241f3a' },
  optionLabel: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  optionDesc: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  nav: { flexDirection: 'row', gap: 10, marginTop: 24 },
  back: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: Brand.cardBorder },
  backTxt: { color: Brand.text, fontWeight: '700' },
  next: { flex: 1, backgroundColor: Brand.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextDisabled: { opacity: 0.4 },
  nextTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
