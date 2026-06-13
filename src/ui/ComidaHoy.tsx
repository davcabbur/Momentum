import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daysBetween } from '@/bodyweight/goal';
import { computeTrend, trendSlopePerWeek } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, getProfile, listWeights } from '@/db/bodyweight-repo';
import { deleteFoodEntry, listFoodEntries, type FoodEntry } from '@/db/food-repo';
import { liveKcalPlan } from '@/nutrition/kcal';
import { macroTargets, sumMacros, type Macros } from '@/nutrition/macros';
import { AddFoodSheet } from '@/ui/AddFoodSheet';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function r0(n: number): number {
  return Math.round(n);
}

export function ComidaHoy() {
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [targets, setTargets] = useState<Macros | null>(null);
  const [sheet, setSheet] = useState(false);
  const date = today();

  const load = useCallback(async () => {
    setFoods(await listFoodEntries(date));
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
    }, [load]),
  );

  const consumed = sumMacros(foods);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Hoy comido</Text>
        <Pressable style={styles.add} onPress={() => setSheet(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTxt}>Alimento</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <MacroBar label="Kcal" consumed={r0(consumed.kcal)} target={targets?.kcal ?? null} color={Brand.good} unit="" />
        <MacroBar label="Proteína" consumed={r0(consumed.protein)} target={targets?.protein ?? null} color={Brand.accent} unit="g" />
        <MacroBar label="Carbos" consumed={r0(consumed.carbs)} target={targets?.carbs ?? null} color={Brand.info} unit="g" />
        <MacroBar label="Grasa" consumed={r0(consumed.fat)} target={targets?.fat ?? null} color="#fbbf24" unit="g" />
        {!targets && <Text style={styles.noTarget}>Completa perfil y peso para ver tus objetivos de macros.</Text>}
      </View>

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
              <Ionicons name="trash-outline" size={18} color="#f87171" />
            </Pressable>
          </View>
        ))
      )}

      <AddFoodSheet visible={sheet} date={date} onClose={() => { setSheet(false); load(); }} />
    </View>
  );
}

function MacroBar({ label, consumed, target, color, unit }: { label: string; consumed: number; target: number | null; color: string; unit: string }) {
  const pct = target && target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  return (
    <View style={styles.bar}>
      <View style={styles.barTop}>
        <Text style={styles.barLbl}>{label}</Text>
        <Text style={styles.barVal}>
          {consumed}
          {target != null ? ` / ${target}` : ''} {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Brand.text, fontSize: 16, fontWeight: '800' },
  add: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Brand.accentStrong, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  bar: {},
  barTop: { flexDirection: 'row', justifyContent: 'space-between' },
  barLbl: { color: Brand.textMuted, fontSize: 12 },
  barVal: { color: Brand.text, fontSize: 12, fontWeight: '700' },
  track: { height: 8, backgroundColor: Brand.track, borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 99 },
  noTarget: { color: Brand.textMuted, fontSize: 12 },
  empty: { color: Brand.textMuted, fontSize: 13, fontStyle: 'italic' },
  foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  foodName: { color: Brand.text, fontSize: 14, fontWeight: '600' },
  foodSub: { color: Brand.textMuted, fontSize: 12, marginTop: 1 },
});
