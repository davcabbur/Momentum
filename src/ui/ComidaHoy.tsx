import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daysBetween } from '@/bodyweight/goal';
import { computeTrend, trendSlopePerWeek } from '@/bodyweight/trend';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { getGoal, getProfile, listWeights } from '@/db/bodyweight-repo';
import { deleteFoodEntry, listFoodEntries, type FoodEntry } from '@/db/food-repo';
import { getCustomMacros } from '@/nutrition/custom-targets';
import { liveKcalPlan } from '@/nutrition/kcal';
import { macroTargets, sumMacros, type Macros } from '@/nutrition/macros';
import { DayDetailSheet } from '@/ui/DayDetailSheet';
import { MacroGoalsSheet } from '@/ui/MacroGoalsSheet';

const DEFAULT_GOALS: Macros = { kcal: 2000, protein: 150, carbs: 200, fat: 65 };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function r0(n: number): number {
  return Math.round(n);
}

export function ComidaHoy({ reloadNonce }: { reloadNonce?: number }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [targets, setTargets] = useState<Macros | null>(null);
  const [custom, setCustom] = useState<Macros | null>(null);
  const [goalsSheet, setGoalsSheet] = useState(false);
  const [detail, setDetail] = useState(false);
  const date = today();

  const load = useCallback(async () => {
    setFoods(await listFoodEntries(date));
    setCustom(await getCustomMacros());
    const prof = await getProfile();
    const weights = await listWeights();
    const goal = await getGoal();
    if (prof && prof.heightCm != null && prof.age != null && weights.length > 0) {
      const trend = computeTrend(weights);
      const trendKg = trend[trend.length - 1].trendKg;
      const actualRate = weights.length >= 3 ? trendSlopePerWeek(trend) : null;
      const hasGoal = goal != null && goal.targetDate != null;
      const daysRemaining = hasGoal ? Math.max(0, daysBetween(date, goal!.targetDate!)) : 0;
      const plan = liveKcalPlan({
        sex: prof.sex,
        age: prof.age,
        heightCm: prof.heightCm,
        activityLevel: prof.activityLevel,
        trendKg,
        targetKg: goal?.targetKg ?? trendKg,
        daysRemaining,
        actualRatePerWeek: actualRate,
      });
      const kcalTarget = hasGoal ? plan.adjustedKcal ?? plan.targetKcal : plan.tdee;
      setTargets(macroTargets(kcalTarget, trendKg, prof.stage ?? 'normocalorica'));
    } else {
      setTargets(null);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  const consumed = sumMacros(foods);
  const goals = custom ?? targets; // personalizados mandan sobre los automáticos

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Hoy comido</Text>

      <Pressable style={styles.card} onPress={() => setDetail(true)}>
        <View style={styles.cardHead}>
          <Text style={styles.cardHeadTxt}>Objetivos del día{custom ? ' · a tu gusto' : ''}</Text>
          <Pressable hitSlop={8} onPress={() => setGoalsSheet(true)}>
            <Text style={styles.editTxt}>Editar</Text>
          </Pressable>
        </View>
        {!goals && <Text style={styles.noTarget}>Completa tu perfil y peso, o pulsa "Editar" para fijar tus objetivos a mano.</Text>}
        <View style={styles.detailRow}>
          <Text style={styles.detailHint}>Toca para ver el detalle de nutrientes</Text>
          <Ionicons name="chevron-forward" size={16} color={c.accent} />
        </View>
      </Pressable>

      {foods.length === 0 ? (
        <Text style={styles.empty}>Aún no has registrado nada hoy.</Text>
      ) : (
        foods.map((f) => (
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

      <MacroGoalsSheet
        visible={goalsSheet}
        initial={goals ?? DEFAULT_GOALS}
        isCustom={custom != null}
        onClose={() => { setGoalsSheet(false); load(); }}
      />
      <DayDetailSheet visible={detail} consumed={consumed} goals={goals} foods={foods} onClose={() => setDetail(false)} />
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    title: { color: c.text, fontSize: 16, fontWeight: '800' },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardHeadTxt: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    editTxt: { color: c.accent, fontSize: 13, fontWeight: '700' },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailHint: { color: c.accent, fontSize: 13, fontWeight: '700' },
    noTarget: { color: c.textMuted, fontSize: 12 },
    empty: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
    foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
    foodName: { color: c.text, fontSize: 14, fontWeight: '600' },
    foodSub: { color: c.textMuted, fontSize: 12, marginTop: 1 },
  });
