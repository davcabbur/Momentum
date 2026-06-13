import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daysBetween } from '@/bodyweight/goal';
import { computeTrend, trendSlopePerWeek } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';
import { getGoal, getProfile, listWeights } from '@/db/bodyweight-repo';
import { liveKcalPlan, proteinTarget } from '@/nutrition/kcal';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function kcal(n: number): string {
  return `${n}`.replace(/\B(?=(\d{3})+(?!\d))/, ' ');
}

export function KcalSummaryCard({ onPress }: { onPress: () => void }) {
  const [data, setData] = useState<{ kcal: number; label: string; protein: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const prof = await getProfile();
        const weights = await listWeights();
        const goal = await getGoal();
        if (!prof || prof.heightCm == null || prof.age == null || weights.length === 0) {
          if (active) setData(null);
          return;
        }
        const trend = computeTrend(weights);
        const trendKg = trend[trend.length - 1].trendKg;
        const actualRate = weights.length >= 3 ? trendSlopePerWeek(trend) : null;
        const hasGoal = goal != null && goal.targetDate != null;
        const daysRemaining = hasGoal ? Math.max(0, daysBetween(today(), goal!.targetDate!)) : 0;
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
        const shown = hasGoal ? plan.adjustedKcal ?? plan.targetKcal : plan.tdee;
        if (active) {
          setData({
            kcal: shown,
            label: hasGoal ? 'objetivo del día' : 'mantenimiento',
            protein: proteinTarget(trendKg, prof.stage ?? 'normocalorica'),
          });
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  if (!data) return null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name="nutrition" size={22} color={Brand.good} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.lbl}>Kcal · {data.label}</Text>
        <Text style={styles.big}>≈ {kcal(data.kcal)} kcal</Text>
        <Text style={styles.sub}>Proteína ≈ {data.protein} g/día</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Brand.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#15251c', alignItems: 'center', justifyContent: 'center' },
  lbl: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  big: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  sub: { color: Brand.textMuted, fontSize: 12, marginTop: 1 },
});
