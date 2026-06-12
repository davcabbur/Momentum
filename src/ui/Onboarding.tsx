import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDate, parseDmy } from '@/bodyweight/format';
import { addDays, estimateTargetDate, estimateTargetWeight, suggestGoal } from '@/bodyweight/goal';
import { Brand } from '@/constants/theme';
import { setGoal, setProfile, upsertWeight } from '@/db/bodyweight-repo';
import { kcalForTarget } from '@/nutrition/kcal';
import { DateField } from '@/ui/DateField';

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

const STEPS = ['Sobre ti', 'Peso inicial', 'Tu etapa', 'Tu actividad', 'Tu objetivo'];

function num(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dateStr, setDateStr] = useState(formatDate(todayIso));
  const [stage, setStage] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [target, setTarget] = useState('');
  const [targetDateStr, setTargetDateStr] = useState('');
  const [weightTouched, setWeightTouched] = useState(false);
  const [dateTouched, setDateTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const startIso = parseDmy(dateStr);
  const initial = num(weight);

  // Al elegir etapa, autocompletamos objetivo (peso + fecha); aún sin "tocar" por el usuario.
  function chooseStage(key: string) {
    setStage(key);
    if (initial > 0 && startIso) {
      const s = suggestGoal({ initialKg: initial, stage: key, startDate: startIso });
      setTarget(String(s.targetKg));
      setTargetDateStr(formatDate(s.targetDate));
      setWeightTouched(false);
      setDateTouched(false);
    }
  }

  // Cambias el peso → si no has tocado la fecha, se recalcula sola.
  function onChangeTarget(v: string) {
    setTarget(v);
    setWeightTouched(true);
    const t = num(v);
    if (!dateTouched && t > 0 && initial > 0 && startIso) {
      setTargetDateStr(formatDate(estimateTargetDate({ initialKg: initial, targetKg: t, startDate: startIso })));
    }
  }

  // Cambias la fecha → si no has tocado el peso, se recalcula solo.
  function onChangeTargetDate(v: string) {
    setTargetDateStr(v);
    setDateTouched(true);
    const d = parseDmy(v);
    if (!weightTouched && d && initial > 0 && startIso && stage) {
      setTarget(String(estimateTargetWeight({ initialKg: initial, startDate: startIso, targetDate: d, stage })));
    }
  }

  const targetIsoParsed = parseDmy(targetDateStr);
  const bothChosen = weightTouched && dateTouched;
  const plan =
    bothChosen && num(target) > 0 && targetIsoParsed && startIso && sex && activity
      ? kcalForTarget({
          sex,
          age: Math.round(Number(age)),
          heightCm: Math.round(num(height)),
          activityLevel: activity,
          currentKg: initial,
          targetKg: num(target),
          startDate: startIso,
          targetDate: targetIsoParsed,
        })
      : null;

  const valid = [
    sex !== null && Number(age) > 0 && num(height) > 0,
    initial > 0 && startIso !== null,
    stage !== null,
    activity !== null,
    num(target) > 0 && targetIsoParsed !== null,
  ];
  const canNext = valid[step];
  const isLast = step === STEPS.length - 1;

  async function finish() {
    setSaving(true);
    const startFinal = startIso ?? todayIso;
    const targetFinal = targetIsoParsed ?? addDays(startFinal, 84);
    await setProfile({
      sex: sex!,
      age: Math.round(Number(age)),
      heightCm: Math.round(num(height)),
      stage: stage!,
      activityLevel: activity!,
    });
    await upsertWeight(startFinal, initial);
    await setGoal(num(target), initial, startFinal, targetFinal);
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
          <Text style={styles.help}>Para calcular tus calorías.</Text>
          <View style={styles.rowOptions}>
            {SEXES.map((o) => (
              <Pressable key={o.key} style={[styles.pill, sex === o.key && styles.pillOn]} onPress={() => setSex(o.key)}>
                <Text style={[styles.pillTxt, sex === o.key && styles.pillTxtOn]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Edad</Text>
          <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="años" placeholderTextColor={Brand.textMuted} style={styles.input} />
          <Text style={[styles.label, { marginTop: 16 }]}>Altura (cm)</Text>
          <TextInput value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="cm" placeholderTextColor={Brand.textMuted} style={styles.input} />
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.label}>Peso inicial (kg)</Text>
          <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor={Brand.textMuted} style={styles.input} />
          <Text style={[styles.label, { marginTop: 16 }]}>Fecha de inicio</Text>
          <Text style={styles.help}>Escríbela o elígela en el calendario. Por defecto, hoy.</Text>
          <DateField value={dateStr} onChange={setDateStr} />
        </>
      )}

      {step === 2 && (
        <View style={styles.optionList}>
          {STAGES.map((o) => (
            <Pressable key={o.key} style={[styles.option, stage === o.key && styles.optionOn]} onPress={() => chooseStage(o.key)}>
              <Text style={styles.optionLabel}>{o.label}</Text>
              <Text style={styles.optionDesc}>{o.desc}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 3 && (
        <View style={styles.optionList}>
          {ACTIVITIES.map((o) => (
            <Pressable key={o.key} style={[styles.option, activity === o.key && styles.optionOn]} onPress={() => setActivity(o.key)}>
              <Text style={styles.optionLabel}>{o.label}</Text>
              <Text style={styles.optionDesc}>{o.desc}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 4 && (
        <>
          <Text style={styles.help}>
            Cambia el peso y la fecha se ajusta sola (y al revés). Si fijas ambos a tu gusto, te calculo las kcal/día
            realistas para lograrlo.
          </Text>
          <Text style={[styles.label, { marginTop: 8 }]}>Peso objetivo (kg)</Text>
          <TextInput value={target} onChangeText={onChangeTarget} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor={Brand.textMuted} style={styles.input} />
          <Text style={[styles.label, { marginTop: 16 }]}>Fecha objetivo</Text>
          <DateField value={targetDateStr} onChange={onChangeTargetDate} />

          {plan && (
            <View style={styles.kcalBox}>
              <Text style={styles.kcalTitle}>≈ {plan.kcal} kcal/día</Text>
              <Text style={styles.kcalDesc}>
                Para llegar a {num(target)} kg el {targetDateStr}. (Mantenimiento ≈ {plan.tdee} kcal;{' '}
                {plan.dailyDeltaKcal <= 0 ? 'déficit' : 'superávit'} de {Math.abs(plan.dailyDeltaKcal)} kcal/día.)
              </Text>
              {plan.kcal < plan.bmr && (
                <Text style={styles.kcalWarn}>
                  ⚠️ Ese ritmo deja las kcal por debajo de tu metabolismo basal ({plan.bmr}). Es muy agresivo: mejor dale
                  algo más de tiempo.
                </Text>
              )}
            </View>
          )}
        </>
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
  kcalBox: { backgroundColor: '#1a2330', borderRadius: 14, padding: 14, marginTop: 16 },
  kcalTitle: { color: Brand.good, fontSize: 22, fontWeight: '800' },
  kcalDesc: { color: '#b9c4d0', fontSize: 12, marginTop: 4 },
  kcalWarn: { color: '#fbbf24', fontSize: 12, marginTop: 8 },
  nav: { flexDirection: 'row', gap: 10, marginTop: 24 },
  back: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: Brand.cardBorder },
  backTxt: { color: Brand.text, fontWeight: '700' },
  next: { flex: 1, backgroundColor: Brand.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextDisabled: { opacity: 0.4 },
  nextTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
