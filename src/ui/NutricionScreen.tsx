import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, daysBetween } from '@/bodyweight/goal';
import { computeTrend, trendSlopePerWeek } from '@/bodyweight/trend';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { getGoal, getProfile, listWeights } from '@/db/bodyweight-repo';
import { cacheProduct, deleteFoodEntry, getCachedProduct, intakeByDay, listFoodEntries, type FoodEntry } from '@/db/food-repo';
import { workingSetsOn } from '@/db/workout-repo';
import { getCustomMacros } from '@/nutrition/custom-targets';
import { estimateRealTdee } from '@/nutrition/tdee-estimate';
import { liveKcalPlan, proteinTarget, type LiveKcalPlan } from '@/nutrition/kcal';
import { macroTargets, sumMacros, type FoodTotals, type Macros } from '@/nutrition/macros';
import { fetchProduct } from '@/nutrition/openfoodfacts';
import { estimateWorkoutKcal } from '@/training/energy';
import { dietBreakAdvice } from '@/training/intelligence';
import { AddFoodFlow, type InitialProduct } from '@/ui/AddFoodFlow';
import { DayDetailSheet } from '@/ui/DayDetailSheet';
import { KcalDashboard } from '@/ui/KcalDashboard';
import { Loading } from '@/ui/Loading';
import { MacroGoalsSheet } from '@/ui/MacroGoalsSheet';
import { ScannerSheet } from '@/ui/ScannerSheet';
import { useRefresh } from '@/ui/useRefresh';

const DEFAULT_GOALS: Macros = { kcal: 2000, protein: 150, carbs: 200, fat: 65 };
const r0 = (n: number) => Math.round(n);

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
  goals: Macros | null; // objetivos del día (kcal + macros) para el dashboard
  consumed: FoodTotals; // lo comido hoy
  burned: number; // kcal estimadas quemadas en el entreno de hoy
  foods: FoodEntry[]; // alimentos registrados hoy
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
    const hasGoal = goal != null && goal.targetDate != null;

    // Objetivos del día (kcal + macros): mismos que en "Objetivos del día", personalizados mandan.
    let autoGoals: Macros | null = null;
    if (plan && trendKg != null && prof) {
      const kcalTarget = hasGoal ? plan.adjustedKcal ?? plan.targetKcal : plan.tdee;
      autoGoals = macroTargets(kcalTarget, trendKg, prof.stage ?? 'normocalorica');
    }
    const goals = cm ?? autoGoals;

    // Lo comido hoy y las kcal estimadas del entreno de hoy.
    const foods = await listFoodEntries(today());
    const consumed = sumMacros(foods);
    const workingSets = await workingSetsOn(today());
    const burned = estimateWorkoutKcal({ workingSets, bodyweightKg: trendKg ?? 0 });

    setS({
      plan,
      protein,
      stage: prof?.stage ?? null,
      hasGoal,
      trendKg,
      dietBreak,
      realTdee,
      missing,
      customKcal: cm?.kcal ?? null,
      goals,
      consumed,
      burned,
      foods,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { control } = useRefresh(load);
  const insets = useSafeAreaInsets();
  const [fabOpen, setFabOpen] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [addFlow, setAddFlow] = useState(false);
  const [initialProduct, setInitialProduct] = useState<InitialProduct | null>(null);
  const [detail, setDetail] = useState(false);
  const [goalsSheet, setGoalsSheet] = useState(false);

  async function onScanned(barcode: string) {
    setScanner(false);
    let product = await getCachedProduct(barcode);
    const noDetail = !!product && product.per100.sugars == null && product.per100.fiber == null && product.per100.satFat == null;
    if (!product || noDetail) {
      const off = await fetchProduct(barcode);
      if (off) {
        await cacheProduct(barcode, off.name, off.per100);
        product = off;
      }
    }
    if (product) {
      setInitialProduct({ name: product.name, per100: product.per100, barcode });
    } else {
      Alert.alert('No encontrado', 'Ese código no está en Open Food Facts (o no hay internet). Añádelo a mano.');
      setInitialProduct({ name: '', per100: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, barcode });
    }
    setAddFlow(true);
  }

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
    <View style={styles.root}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={control}>
      <Text style={styles.h1}>Nutrición</Text>
      <Text style={styles.intro}>Tus calorías guía, calculadas con tu tendencia de peso (no con el dato de un día).</Text>

      {s.goals && (
        <KcalDashboard
          goalKcal={s.goals.kcal}
          foodKcal={s.consumed.kcal}
          burnedKcal={s.burned}
          protein={{ goal: s.goals.protein, consumed: s.consumed.protein }}
          carbs={{ goal: s.goals.carbs, consumed: s.consumed.carbs }}
          fat={{ goal: s.goals.fat, consumed: s.consumed.fat }}
          onPress={() => setDetail(true)}
        />
      )}

      <Text style={styles.h2}>Hoy comido</Text>
      {s.foods.length === 0 ? (
        <Text style={styles.emptyFood}>Aún no has registrado nada hoy. Usa el botón + para añadir.</Text>
      ) : (
        s.foods.map((f) => (
          <View key={f.id} style={styles.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{f.name}</Text>
              <Text style={styles.foodSub}>
                {f.grams ? `${r0(f.grams)} g · ` : ''}{r0(f.kcal)} kcal · P {f.protein} · C {f.carbs} · G {f.fat}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={async () => { await deleteFoodEntry(f.id); load(); }}>
              <Ionicons name="trash-outline" size={18} color={c.bad} />
            </Pressable>
          </View>
        ))
      )}

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
              <Text style={styles.note}>Lo has ajustado a mano. Cámbialo (o vuelve al automático) tocando el panel de arriba → «Editar objetivos».</Text>
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

      {/* Menú del botón + */}
      {fabOpen && (
        <Pressable style={styles.menuBackdrop} onPress={() => setFabOpen(false)}>
          <View style={[styles.menu, { bottom: insets.bottom + 86, right: 18 }]}>
            <Pressable style={styles.menuItem} onPress={() => { setFabOpen(false); setScanner(true); }}>
              <Ionicons name="barcode-outline" size={26} color={c.accent} />
              <Text style={styles.menuTxt}>Escanear</Text>
            </Pressable>
            <View style={styles.menuSep} />
            <Pressable style={styles.menuItem} onPress={() => { setFabOpen(false); setInitialProduct(null); setAddFlow(true); }}>
              <Ionicons name="restaurant-outline" size={26} color={c.accent} />
              <Text style={styles.menuTxt}>Alimento</Text>
            </Pressable>
          </View>
        </Pressable>
      )}

      <Pressable style={[styles.fab, { bottom: insets.bottom + 18 }]} onPress={() => setFabOpen((v) => !v)}>
        <Ionicons name={fabOpen ? 'close' : 'add'} size={30} color={c.onAccent} />
      </Pressable>

      <ScannerSheet visible={scanner} onClose={() => setScanner(false)} onScanned={onScanned} />
      <AddFoodFlow
        visible={addFlow}
        date={today()}
        initial={initialProduct}
        onClose={() => { setAddFlow(false); setInitialProduct(null); }}
        onAdded={() => { setAddFlow(false); setInitialProduct(null); load(); }}
      />
      <DayDetailSheet
        visible={detail}
        consumed={s.consumed}
        goals={s.goals}
        foods={s.foods}
        onClose={() => setDetail(false)}
        onEditGoals={() => { setDetail(false); setGoalsSheet(true); }}
      />
      <MacroGoalsSheet
        visible={goalsSheet}
        initial={s.goals ?? DEFAULT_GOALS}
        isCustom={s.customKcal != null}
        onClose={() => { setGoalsSheet(false); load(); }}
      />
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.surface },
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, paddingBottom: 90, gap: 10 },
    fab: {
      position: 'absolute',
      right: 18,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.accentStrong,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.accentStrong,
      shadowOpacity: 0.5,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    menuBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0006' },
    menu: { position: 'absolute', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 16, overflow: 'hidden', minWidth: 230 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 20, paddingHorizontal: 22 },
    menuTxt: { color: c.text, fontSize: 18, fontWeight: '700' },
    menuSep: { height: 1, backgroundColor: c.cardBorder },
    h1: { color: c.text, fontSize: 20, fontWeight: '800' },
    h2: { color: c.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
    intro: { color: c.textMuted, fontSize: 13, marginBottom: 4 },
    emptyFood: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
    foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
    foodName: { color: c.text, fontSize: 14, fontWeight: '600' },
    foodSub: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
    cardLbl: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    big: { color: c.text, fontSize: 24, fontWeight: '800' },
    note: { color: c.textMuted, fontSize: 13, lineHeight: 19 },
    foot: { color: c.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  });
