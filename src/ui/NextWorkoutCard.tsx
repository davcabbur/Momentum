import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getActiveRoutine, listDays } from '@/db/routine-repo';
import { lastSessionDayId } from '@/db/workout-repo';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { nextDay, type DayRef } from '@/training/next-day';

export function NextWorkoutCard({ reloadNonce }: { reloadNonce?: number }) {
  const router = useRouter();
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [next, setNext] = useState<DayRef | null>(null);
  const [hasRoutine, setHasRoutine] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const r = await getActiveRoutine();
        const days = r ? await listDays(r.id) : [];
        const lastDayId = await lastSessionDayId();
        if (active) {
          setHasRoutine(r != null && days.length > 0);
          setNext(nextDay(days.map((d) => ({ id: d.id, name: d.name })), lastDayId));
        }
      })();
      return () => {
        active = false;
      };
    }, [reloadNonce]),
  );

  if (hasRoutine === null) return null;

  if (!hasRoutine) {
    return (
      <Pressable style={styles.card} onPress={() => router.navigate('/entreno')}>
        <View style={styles.iconWrap}>
          <Ionicons name="barbell" size={22} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.lbl}>Entreno</Text>
          <Text style={styles.name}>Crea tu rutina</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={() => router.navigate('/entreno')}>
      <View style={styles.iconWrap}>
        <Ionicons name="barbell" size={22} color={c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.lbl}>Siguiente entreno</Text>
        <Text style={styles.name}>{next?.name ?? 'Tu rutina'}</Text>
      </View>
      <Text style={styles.go}>Entrenar ›</Text>
    </Pressable>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentSurface, alignItems: 'center', justifyContent: 'center' },
    lbl: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    name: { color: c.text, fontSize: 18, fontWeight: '800' },
    go: { color: c.accent, fontWeight: '700' },
  });
