import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { addDays, daysBetween } from '@/bodyweight/goal';
import { computeTrend, trendSlopePerWeek } from '@/bodyweight/trend';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { getGoal, getProfile, listWeights } from '@/db/bodyweight-repo';
import { intakeByDay } from '@/db/food-repo';
import { getCustomMacros } from '@/nutrition/custom-targets';
import { estimateRealTdee } from '@/nutrition/tdee-estimate';
import { liveKcalPlan, proteinTarget, type LiveKcalPlan } from '@/nutrition/kcal';
import { dietBreakAdvice } from '@/training/intelligence';
import { ComidaHoy } from '@/ui/ComidaHoy';
import { Loading } from '@/ui/Loading';
import { useRefresh } from '@/ui/useRefresh';

const STAGE_LABEL: Record<string, string> = {
  definicion: 'Déficit calórico',
  normocalorica: 'Normocalórica',
  volumen: 'Superávit calórico',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function kcal(n: number): string {
  return `${n}`.replace(/\B(?=(\d{3})+(?!\d))/, ' ');
}

function rate(r: number): string {
  const v = Math.round(r * 10) / 10;
  return `${v > 0 ? '+' : ''}${String(v).replace('.', ',')} kg/sem`;
}

interface State {
  plan: LiveKcalPlan | null;
  protein: number | null;
  stage: string | null;
  hasGoal: boolean;
  trendKg: number | null;
  dietBreak: string | null;
  realTdee: number | null; // gasto real estimado por ingesta vs cambio de peso
  missing: string | null; // qué falta para poder calcular
  customKcal: number | null; // objetivo de kcal fijado a mano por el usuario
}

export function NutricionScreen() {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [s, setS] = useState<State | null>(null);

  const load = useCallback(async () => {
    const prof = await getProfile();
    const weights = await listWeights();
    const goal = await getGoal();

    let missing: string | null = null;
    if (!prof || prof.heightCm == null || prof.age == null) missing = 'perfil';
    else if (weights.length === 0) missing = 'peso';

    const trend = computeTrend(weights);
    const trendKg = trend.length ? trend[trend.length - 1].trendKg : null;
    const actualRate = weights.length >= 3 ? trendSlopePerWeek(trend) : null;

    let plan: LiveKcalPlan | null = null;
    let protein: number | null = null;
    if (prof && prof.heightCm != null && prof.age != null && trendKg != null) {
      const daysRemaining = goal && goal.targetDate ? Math.max(0, daysBetween(today(), goal.targetDate)) : 0;
      plan = liveKcalPlan({
        sex: prof.sex,
        age: prof.age,
        heightCm: prof.heightCm,
        activityLevel: prof.activityLevel,
        trendKg,
        targetKg: goal?.targetKg ?? trendKg,
        daysRemaining,
        actualRatePerWeek: actualRate,
      });
      protein = proteinTarget(trendKg, prof.stage ?? 'normocalorica');
    }

    let dietBreak: string | null = null;
    if (prof?.stage === 'definicion' && goal?.startDate) {
      const weeks = Math.floor(daysBetween(goal.startDate, today()) / 7);
      dietBreak = dietBreakAdvice('definicion', weeks)?.text ?? null;
    }

    // Gasto real estimado: ingesta media de ~14 días vs cambio de peso de tendencia.
    let realTdee: number | null = null;
    const fromDate = addDays(today(), -14);
    const intake = await intakeByDay(fromDate);
    if (intake.length > 0 && trend.length >= 2) {
      const avgIntakeKcal = intake.reduce((a, d) => a + d.kcal, 0) / intake.length;
      const windowTrend = trend.filter((p) => p.date >= fromDate);
      const past = windowTrend[0] ?? trend[0];
      const span = daysBetween(past.date, trend[trend.length - 1].date);
      realTdee = estimateRealTdee({
        avgIntakeKcal,
        weightChangeKg: trend[trend.length - 1].trendKg - past.trendKg,
        spanDays: span,
        loggedDays: intake.length,
      });
    }

    const cm = await getCustomMacros();
    setS({ plan, protein, stage: prof?.stage ?? null, hasGoal: goal != null && goal.targetDate != null, trendKg, dietBreak, realTdee, missing, customKcal: cm?.kcal ?? null });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { control, nonce } = useRefresh(load);

  if (!s) return <Loading />;

  const trackMsg = (p: LiveKcalPlan): { color: string; text: string } => {
    switch (p.track) {
      case 'en-camino':
        return { color: c.good, text: `Vas en camino 👍 Mantén unas ${kcal(p.targetKcal)} kcal/día.` };
      case 'rapido':
        return {
          color: c.info,
          text: `Vas algo más rápido de lo previsto (${rate(p.actualRatePerWeek!)}). Para cuidar el músculo y que sea sostenible, podrías subir a ~${kcal(p.adjustedKcal!)} kcal/día.`,
        };
      case 'lento':
        return {
          color: c.warn,
          text: `Vas algo más lento de lo previsto (${rate(p.actualRatePerWeek!)}). Puedes ajustar a ~${kcal(p.adjustedKcal!)} kcal/día o darle más tiempo, sin agobios.`,
        };
      default:
        return { color: c.textMuted, text: 'Aún no hay tendencia suficiente para ajustar. Sigue registrando tu peso y en unas semanas afino las kcal.' };
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={control}>
      <Text style={styles.h1}>Nutrición</Text>
      <Text style={styles.intro}>Tus calorías guía, calculadas con tu tendencia de peso (no con el dato de un día).</Text>

      <ComidaHoy reloadNonce={nonce} />

      {s.missing === 'perfil' && (
        <View style={styles.card}>
          <Text style={styles.note}>Completa tu perfil (sexo, edad y altura) en el alta para calcular tus kcal.</Text>
        </View>
      )}
      {s.missing === 'peso' && (
        <View style={styles.card}>
          <Text style={styles.note}>Registra tu peso en la pestaña Hoy para calcular tus kcal.</Text>
        </View>
      )}

      {s.plan && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLbl}>Mantenimiento</Text>
            <Text style={styles.big}>≈ {kcal(s.plan.tdee)} kcal/día</Text>
            <Text style={styles.note}>Lo que gastas al día (TDEE) con tu peso de tendencia y tu actividad. Comer alrededor de esto mantiene tu peso.</Text>
          </View>

          {s.realTdee != null && (
            <View style={[styles.card, { borderColor: c.info }]}>
              <Text style={styles.cardLbl}>Gasto real estimado</Text>
              <Text style={[styles.big, { color: c.info }]}>≈ {kcal(s.realTdee)} kcal/día</Text>
              <Text style={styles.note}>
                Calculado con lo que comes y cómo cambia tu peso estas semanas (más fiable que la fórmula).{' '}
                {Math.abs(s.realTdee - s.plan.tdee) >= 100
                  ? `La estimación teórica era ~${kcal(s.plan.tdee)} kcal; tu cuerpo parece gastar ${s.realTdee > s.plan.tdee ? 'más' : 'menos'}.`
                  : 'Coincide con la estimación teórica.'}
              </Text>
            </View>
          )}

          {s.customKcal != null ? (
            <View style={styles.card}>
              <Text style={styles.cardLbl}>Tu objetivo · a tu gusto</Text>
              <Text style={[styles.big, { color: c.good }]}>≈ {kcal(s.customKcal)} kcal/día</Text>
              <Text style={styles.note}>Lo has ajustado a mano. Cámbialo (o vuelve al automático) desde «Objetivos del día», arriba.</Text>
            </View>
          ) : s.hasGoal ? (
            <View style={styles.card}>
              <Text style={styles.cardLbl}>Objetivo {s.stage ? `· ${STAGE_LABEL[s.stage] ?? s.stage}` : ''}</Text>
              <Text style={[styles.big, { color: c.good }]}>≈ {kcal(s.plan.targetKcal)} kcal/día</Text>
              <Text style={styles.note}>
                Ritmo previsto {rate(s.plan.plannedRatePerWeek)}. {s.plan.targetKcal <= s.plan.tdee ? 'Déficit' : 'Superávit'} de{' '}
                {kcal(Math.abs(s.plan.targetKcal - s.plan.tdee))} kcal/día.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.note}>Fija un objetivo de peso en Hoy y te calculo las kcal/día para llegar a él a buen ritmo.</Text>
            </View>
          )}

          {s.hasGoal && (
            <View style={[styles.card, { borderColor: trackMsg(s.plan).color }]}>
              <Text style={styles.cardLbl}>Ajuste por tu tendencia</Text>
              <Text style={[styles.note, { color: trackMsg(s.plan).color }]}>{trackMsg(s.plan).text}</Text>
            </View>
          )}


          {s.dietBreak && (
            <View style={[styles.card, { borderColor: c.info }]}>
              <Text style={styles.cardLbl}>Descanso de dieta</Text>
              <Text style={[styles.note, { color: c.info }]}>{s.dietBreak}</Text>
            </View>
          )}

          <Text style={styles.foot}>Son estimaciones para orientarte. Ajústalas según cómo responde tu peso a lo largo de las semanas.</Text>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 10 },
    h1: { color: c.text, fontSize: 20, fontWeight: '800' },
    intro: { color: c.textMuted, fontSize: 13, marginBottom: 4 },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
    cardLbl: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    big: { color: c.text, fontSize: 24, fontWeight: '800' },
    note: { color: c.textMuted, fontSize: 13, lineHeight: 19 },
    foot: { color: c.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  });
