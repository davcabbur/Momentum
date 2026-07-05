import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { addDays } from '@/bodyweight/goal';
import { formatDate, formatKg } from '@/bodyweight/format';
import { computeTrend } from '@/bodyweight/trend';
import { getGoal, listWeights } from '@/db/bodyweight-repo';
import { weightGoal } from '@/db/schema';
import { SetGoalSheet } from '@/ui/SetGoalSheet';
import { useTheme } from '@/ui/theme';
import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

type Goal = typeof weightGoal.$inferSelect;
const today = () => new Date().toISOString().slice(0, 10);

export function ObjetivoScreen() {
  const { c } = useTheme();
  const styles = useAjustesStyles();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [trendKg, setTrendKg] = useState(75);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    setGoal(await getGoal());
    const tr = computeTrend(await listWeights());
    if (tr.length) setTrendKg(tr[tr.length - 1].trendKg);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Objetivo de peso" />
      <View style={styles.card}>
        {goal ? (
          <Text style={styles.note}>
            Objetivo: {formatKg(goal.targetKg)}{goal.targetDate ? ` para el ${formatDate(goal.targetDate)}` : ''}. Es una guía, no una fecha límite.
          </Text>
        ) : (
          <Text style={styles.note}>Aún no tienes un objetivo de peso. Ponlo para calcular tus kcal guía y ver tu progreso.</Text>
        )}
        <Pressable style={styles.save} onPress={() => setSheet(true)}>
          <Text style={styles.saveTxt}>Editar peso objetivo y fecha</Text>
        </Pressable>
      </View>

      <SetGoalSheet
        visible={sheet}
        initialTargetKg={goal?.targetKg ?? Math.round(trendKg - 4)}
        initialTargetDate={goal?.targetDate ?? addDays(today(), 84)}
        startKg={goal?.startKg ?? trendKg}
        startDate={goal?.startDate ?? today()}
        canClear={goal !== null}
        onClose={() => { setSheet(false); load(); }}
      />
    </ScrollView>
  );
}
