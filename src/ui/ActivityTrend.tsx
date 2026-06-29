import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { addDays } from '@/bodyweight/goal';
import { getStepsGoal, listActivityDays } from '@/db/activity-repo';
import { trendSeries, weeklyAverage } from '@/activity/steps';
import { LineChart } from '@/ui/LineChart';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityTrend({ reloadNonce }: { reloadNonce?: number }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [series, setSeries] = useState<{ date: string; steps: number }[]>([]);
  const [avg, setAvg] = useState(0);
  const [goal, setGoal] = useState(8000);

  const load = useCallback(async () => {
    const todayStr = today();
    const from = addDays(todayStr, -29);
    const days = await listActivityDays(from);
    setSeries(trendSeries(days, from, todayStr));
    setAvg(weeklyAverage(days));
    setGoal(await getStepsGoal());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  const hasData = series.some((d) => d.steps > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pasos · últimos 30 días</Text>
      {hasData ? (
        <>
          <LineChart values={series.map((d) => d.steps)} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{avg}</Text>
              <Text style={styles.statLbl}>media (7 días)</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{goal}</Text>
              <Text style={styles.statLbl}>meta diaria</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.note}>Aún no hay pasos registrados. Conecta Health Connect o añádelos a mano en Inicio.</Text>
      )}
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
    title: { color: c.text, fontSize: 15, fontWeight: '800' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    stat: { alignItems: 'center' },
    statVal: { color: c.accent, fontSize: 17, fontWeight: '800' },
    statLbl: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    note: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
  });
