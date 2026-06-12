import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { seedExercisesIfEmpty } from '@/db/exercise-repo';
import { getActiveRoutine, listDays, type RoutineDay } from '@/db/routine-repo';
import { RoutineBuilder } from '@/ui/RoutineBuilder';
import { SessionScreen } from '@/ui/SessionScreen';

type EntrenoView = 'home' | 'builder' | { dayId: number; dayName: string };

export function EntrenoScreen() {
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [view, setView] = useState<EntrenoView>('home');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    await seedExercisesIfEmpty();
    const r = await getActiveRoutine();
    setRoutineId(r?.id ?? null);
    setDays(r ? await listDays(r.id) : []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return <View style={styles.screen} />;
  if (view === 'builder') return <RoutineBuilder onDone={() => { setView('home'); load(); }} />;
  if (typeof view === 'object') {
    return <SessionScreen dayId={view.dayId} dayName={view.dayName} onBack={() => { setView('home'); load(); }} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Entreno</Text>
      {routineId == null ? (
        <Pressable style={styles.cta} onPress={() => setView('builder')}>
          <Text style={styles.ctaTxt}>＋ Crear mi rutina</Text>
        </Pressable>
      ) : (
        <>
          {days.length === 0 && <Text style={styles.muted}>Tu rutina no tiene días aún. Toca "Editar rutina".</Text>}
          {days.map((d) => (
            <Pressable key={d.id} style={styles.dayCard} onPress={() => setView({ dayId: d.id, dayName: d.name })}>
              <Text style={styles.dayName}>{d.name}</Text>
              <Text style={styles.dayGo}>Entrenar ›</Text>
            </Pressable>
          ))}
          <Pressable style={styles.edit} onPress={() => setView('builder')}>
            <Text style={styles.editTxt}>Editar rutina</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 12 },
  h1: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  muted: { color: Brand.textMuted },
  cta: { backgroundColor: Brand.accentStrong, borderRadius: 14, padding: 18, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  dayCard: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  dayGo: { color: Brand.accent, fontWeight: '700' },
  edit: { padding: 12, alignItems: 'center' },
  editTxt: { color: Brand.textMuted },
});
