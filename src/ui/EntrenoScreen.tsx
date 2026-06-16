import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { daysBetween } from '@/bodyweight/goal';
import { Brand } from '@/constants/theme';
import { seedExercises } from '@/db/exercise-repo';
import { getActiveRoutine, listDays, type RoutineDay } from '@/db/routine-repo';
import { deleteEmptySessions, lastSessionDate } from '@/db/workout-repo';
import { welcomeBackAdvice } from '@/training/intelligence';
import { Loading } from '@/ui/Loading';
import { RoutineBuilder } from '@/ui/RoutineBuilder';
import { SessionScreen } from '@/ui/SessionScreen';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type EntrenoView = 'home' | 'builder' | { dayId: number; dayName: string };

export function EntrenoScreen() {
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [view, setView] = useState<EntrenoView>('home');
  const [loaded, setLoaded] = useState(false);
  const [welcome, setWelcome] = useState<string | null>(null);

  const load = useCallback(async () => {
    await seedExercises();
    await deleteEmptySessions();
    const r = await getActiveRoutine();
    setRoutineId(r?.id ?? null);
    const ds = r ? await listDays(r.id) : [];
    setDays(Array.isArray(ds) ? ds : []);
    const last = await lastSessionDate();
    setWelcome(last ? welcomeBackAdvice(daysBetween(last, today()))?.text ?? null : null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return <Loading />;
  if (view === 'builder') return <RoutineBuilder onDone={() => { setView('home'); load(); }} />;
  if (typeof view === 'object') {
    return <SessionScreen dayId={view.dayId} dayName={view.dayName} onBack={() => { setView('home'); load(); }} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Entreno</Text>
      {welcome && (
        <View style={styles.welcome}>
          <Text style={styles.welcomeTxt}>{welcome}</Text>
        </View>
      )}
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
  welcome: { backgroundColor: '#1a2330', borderRadius: 14, padding: 14 },
  welcomeTxt: { color: '#b9c4d0', fontSize: 13, lineHeight: 19 },
  cta: { backgroundColor: Brand.accentStrong, borderRadius: 14, padding: 18, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  dayCard: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  dayGo: { color: Brand.accent, fontWeight: '700' },
  edit: { padding: 12, alignItems: 'center' },
  editTxt: { color: Brand.textMuted },
});
