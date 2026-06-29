import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays } from '@/bodyweight/goal';
import { getStepsGoal, listActivityDays, upsertActivityDay } from '@/db/activity-repo';
import { GLOSSARY } from '@/education/glossary';
import { computeStreak, goalProgress } from '@/activity/steps';
import { ensureStepsPermission, hasStepsPermission, isHealthAvailable, readDailySteps } from '@/lib/health-connect';
import { ProgressRing } from '@/ui/ProgressRing';
import { StepsSheet } from '@/ui/StepsSheet';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityCard({ reloadNonce }: { reloadNonce?: number }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [goal, setGoal] = useState(8000);
  const [todaySteps, setTodaySteps] = useState(0);
  const [streak, setStreak] = useState(0);
  const [available, setAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    const todayStr = today();
    const g = await getStepsGoal();
    setGoal(g);
    const avail = await isHealthAvailable();
    setAvailable(avail);
    const granted = avail && (await hasStepsPermission());
    setConnected(granted);
    if (granted) {
      const data = await readDailySteps(addDays(todayStr, -29), todayStr);
      for (const d of data) await upsertActivityDay(d.date, d.steps, 'health_connect');
    }
    const days = await listActivityDays(addDays(todayStr, -29));
    setTodaySteps(days.find((d) => d.date === todayStr)?.steps ?? 0);
    setStreak(computeStreak(days, g, todayStr));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  async function connect() {
    const ok = await ensureStepsPermission();
    if (!ok) Alert.alert('Health Connect', 'No se pudo conectar. Puedes meter tus pasos a mano.');
    load();
  }

  function explain() {
    const t = GLOSSARY.find((x) => x.key === 'neat');
    if (t) Alert.alert(t.title, t.body);
  }

  const pct = goalProgress(todaySteps, goal);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Actividad de hoy</Text>
        {streak > 0 && <Text style={styles.streak}>🔥 {streak}</Text>}
        <Pressable hitSlop={8} onPress={explain}>
          <Ionicons name="help-circle-outline" size={18} color={c.textMuted} />
        </Pressable>
      </View>

      <View style={styles.ringRow}>
        <ProgressRing pct={pct}>
          <Text style={styles.steps}>{todaySteps}</Text>
          <Text style={styles.stepsLbl}>pasos</Text>
        </ProgressRing>
        <View style={styles.info}>
          <Text style={styles.goalTxt}>Meta {goal} pasos</Text>
          <Text style={styles.sourceTxt}>{connected ? 'Sincronizado con Health Connect' : available ? 'Sin conectar' : 'Entrada manual'}</Text>
        </View>
      </View>

      {available && !connected && (
        <Pressable style={styles.primary} onPress={connect}>
          <Text style={styles.primaryTxt}>Conectar Health Connect</Text>
        </Pressable>
      )}
      <Pressable style={styles.secondary} onPress={() => setSheet(true)}>
        <Text style={styles.secondaryTxt}>{connected ? 'Editar meta' : 'Añadir pasos / meta'}</Text>
      </Pressable>

      <StepsSheet
        visible={sheet}
        date={today()}
        initialGoal={goal}
        initialSteps={todaySteps}
        onClose={() => {
          setSheet(false);
          load();
        }}
      />
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: c.text, fontSize: 16, fontWeight: '800', flex: 1 },
    streak: { color: c.flame, fontSize: 15, fontWeight: '800' },
    ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    steps: { color: c.text, fontSize: 22, fontWeight: '800' },
    stepsLbl: { color: c.textMuted, fontSize: 12, marginTop: -2 },
    info: { flex: 1, gap: 4 },
    goalTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
    sourceTxt: { color: c.textMuted, fontSize: 12 },
    primary: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    primaryTxt: { color: c.onAccent, fontWeight: '800' },
    secondary: { borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
    secondaryTxt: { color: c.accent, fontWeight: '700' },
  });
