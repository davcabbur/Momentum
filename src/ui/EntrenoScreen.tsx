import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { daysBetween } from '@/bodyweight/goal';
import { Brand } from '@/constants/theme';
import { seedExercises } from '@/db/exercise-repo';
import { getActiveRoutine, listDayExercises, listDays, type RoutineDay } from '@/db/routine-repo';
import { deleteEmptySessions, lastSessionDate, lastSessionDayId } from '@/db/workout-repo';
import { welcomeBackAdvice } from '@/training/intelligence';
import { nextDay } from '@/training/next-day';
import { Loading } from '@/ui/Loading';
import { RoutineBuilder } from '@/ui/RoutineBuilder';
import { SessionScreen } from '@/ui/SessionScreen';
import { useRefresh } from '@/ui/useRefresh';

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
  const [suggestedId, setSuggestedId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string[]>([]);

  const load = useCallback(async () => {
    await seedExercises();
    await deleteEmptySessions();
    const r = await getActiveRoutine();
    setRoutineId(r?.id ?? null);
    const ds = r ? await listDays(r.id) : [];
    setDays(Array.isArray(ds) ? ds : []);
    const last = await lastSessionDate();
    setWelcome(last ? welcomeBackAdvice(daysBetween(last, today()))?.text ?? null : null);
    const suggested = nextDay(ds.map((d) => ({ id: d.id, name: d.name })), await lastSessionDayId());
    setSuggestedId(suggested?.id ?? null);
    setPreview(suggested ? (await listDayExercises(suggested.id)).map((e) => e.exercise.name) : []);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { control } = useRefresh(load);

  if (!loaded) return <Loading />;
  if (view === 'builder') return <RoutineBuilder onDone={() => { setView('home'); load(); }} />;
  if (typeof view === 'object') {
    return <SessionScreen dayId={view.dayId} dayName={view.dayName} onBack={() => { setView('home'); load(); }} />;
  }

  const suggested = days.find((d) => d.id === suggestedId) ?? null;
  const others = days.filter((d) => d.id !== suggestedId);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={control}>
      <Text style={styles.h1}>Entreno</Text>

      {welcome && (
        <View style={styles.welcome}>
          <Text style={styles.welcomeTxt}>{welcome}</Text>
        </View>
      )}

      {routineId == null ? (
        <Pressable style={styles.cta} onPress={() => setView('builder')}>
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.ctaTxt}>Crear mi rutina</Text>
        </Pressable>
      ) : days.length === 0 ? (
        <>
          <Text style={styles.muted}>Tu rutina no tiene días aún.</Text>
          <Pressable style={styles.cta} onPress={() => setView('builder')}>
            <Text style={styles.ctaTxt}>Editar rutina</Text>
          </Pressable>
        </>
      ) : (
        <>
          {suggested && (
            <View style={styles.hero}>
              <Text style={styles.heroLbl}>Hoy te toca</Text>
              <Text style={styles.heroDay}>{suggested.name}</Text>
              {preview.length > 0 && <Text style={styles.heroPreview}>{preview.join(' · ')}</Text>}
              <Pressable style={styles.heroBtn} onPress={() => setView({ dayId: suggested.id, dayName: suggested.name })}>
                <Ionicons name="play" size={18} color="#06240f" />
                <Text style={styles.heroBtnTxt}>Empezar entreno</Text>
              </Pressable>
            </View>
          )}

          {others.length > 0 && <Text style={styles.section}>Otros días</Text>}
          {others.map((d) => (
            <Pressable key={d.id} style={styles.dayCard} onPress={() => setView({ dayId: d.id, dayName: d.name })}>
              <Text style={styles.dayName}>{d.name}</Text>
              <Text style={styles.dayGo}>Entrenar ›</Text>
            </Pressable>
          ))}

          <Pressable style={styles.edit} onPress={() => setView('builder')}>
            <Ionicons name="create-outline" size={16} color={Brand.textMuted} />
            <Text style={styles.editTxt}>Editar rutina</Text>
          </Pressable>

          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={18} color={Brand.info} />
            <Text style={styles.infoTxt}>
              Al registrar, el peso es el total que levantas, incluida la barra (p. ej. barra 20 kg + 20 kg de discos = 40 kg).
              En dominadas y fondos ya cuenta tu peso corporal.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 12 },
  h1: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  welcome: { backgroundColor: '#1a2330', borderRadius: 14, padding: 14 },
  welcomeTxt: { color: '#b9c4d0', fontSize: 13, lineHeight: 19 },
  muted: { color: Brand.textMuted },
  cta: { backgroundColor: Brand.accentStrong, borderRadius: 14, padding: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hero: { backgroundColor: Brand.card, borderColor: Brand.accentStrong, borderWidth: 1, borderRadius: 18, padding: 18, gap: 6 },
  heroLbl: { color: Brand.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  heroDay: { color: Brand.text, fontSize: 26, fontWeight: '800' },
  heroPreview: { color: Brand.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 6 },
  heroBtn: { backgroundColor: Brand.good, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  heroBtnTxt: { color: '#06240f', fontWeight: '800', fontSize: 16 },
  section: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 4 },
  dayCard: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  dayGo: { color: Brand.accent, fontWeight: '700' },
  edit: { padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 4 },
  editTxt: { color: Brand.textMuted },
  info: { flexDirection: 'row', gap: 8, backgroundColor: '#1a2330', borderRadius: 12, padding: 12 },
  infoTxt: { color: '#b9c4d0', fontSize: 12, lineHeight: 18, flex: 1 },
});
