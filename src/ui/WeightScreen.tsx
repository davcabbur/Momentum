import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { listWeights } from '@/db/bodyweight-repo';
import { KcalSummaryCard } from '@/ui/KcalSummaryCard';
import { Loading } from '@/ui/Loading';
import { NextWorkoutCard } from '@/ui/NextWorkoutCard';
import { Onboarding } from '@/ui/Onboarding';
import { WeightSummaryCard } from '@/ui/WeightSummaryCard';

/** Inicio: panel ligero con accesos rápidos (entreno, kcal, peso). El detalle vive en cada pestaña. */
export function WeightScreen() {
  const router = useRouter();
  const [hasWeights, setHasWeights] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setHasWeights((await listWeights()).length > 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (hasWeights === null) return <Loading />;
  if (!hasWeights) return <Onboarding onDone={load} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.h1}>Inicio</Text>
        <Pressable style={styles.gear} onPress={() => router.push('/ajustes')} hitSlop={10}>
          <Ionicons name="settings-outline" size={22} color={Brand.textMuted} />
        </Pressable>
      </View>

      <WeightSummaryCard />
      <KcalSummaryCard onPress={() => router.push('/nutricion')} />
      <NextWorkoutCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  gear: { padding: 4 },
});
