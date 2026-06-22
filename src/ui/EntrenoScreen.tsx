import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { daysBetween } from '@/bodyweight/goal';
import { seedExercises } from '@/db/exercise-repo';
import { getActiveRoutine, listDayExercises, listDays, type RoutineDay } from '@/db/routine-repo';
import { getSetting, setSetting } from '@/db/settings-repo';
import { deleteEmptySessions, lastSessionDate, lastSessionDayId } from '@/db/workout-repo';
import { welcomeBackAdvice } from '@/training/intelligence';
import { nextDay } from '@/training/next-day';
import { Loading } from '@/ui/Loading';
import { RoutineBuilder } from '@/ui/RoutineBuilder';
import { SessionScreen } from '@/ui/SessionScreen';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { useRefresh } from '@/ui/useRefresh';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type EntrenoView = 'home' | 'builder';
type ActiveSession = { dayId: number; dayName: string };

export function EntrenoScreen() {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [view, setView] = useState<EntrenoView>('home');
  const [active, setActive] = useState<ActiveSession | null>(null);
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
    // Sesión en curso (persistida): si hay una, Entreno muestra solo ese entreno.
    const raw = await getSetting('active_session');
    let act: ActiveSession | null = null;
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (p && ds.some((d) => d.id === p.dayId)) act = { dayId: p.dayId, dayName: String(p.dayName) };
      } catch {
        /* ignora json inválido */
      }
    }
    if (raw && !act) await setSetting('active_session', ''); // el día ya no existe
    setActive(act);
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

  async function startDay(dayId: number, dayName: string) {
    await setSetting('active_session', JSON.stringify({ dayId, dayName }));
    setActive({ dayId, dayName });
  }

  async function finishSession() {
    await setSetting('active_session', '');
    setActive(null);
    load();
  }

  if (!loaded) return <Loading />;
  if (active) return <SessionScreen dayId={active.dayId} dayName={active.dayName} locked onBack={finishSession} />;
  if (view === 'builder') return <RoutineBuilder onDone={() => { setView('home'); load(); }} />;

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
          <Ionicons name="add-circle-outline" size={22} color={c.onAccent} />
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
              <Pressable style={styles.heroBtn} onPress={() => startDay(suggested.id, suggested.name)}>
                <Ionicons name="play" size={18} color={c.onGood} />
                <Text style={styles.heroBtnTxt}>Empezar entreno</Text>
              </Pressable>
            </View>
          )}

          {others.length > 0 && <Text style={styles.section}>Otros días</Text>}
          {others.map((d) => (
            <Pressable key={d.id} style={styles.dayCard} onPress={() => startDay(d.id, d.name)}>
              <Text style={styles.dayName}>{d.name}</Text>
              <Text style={styles.dayGo}>Entrenar ›</Text>
            </Pressable>
          ))}

          <Pressable style={styles.edit} onPress={() => setView('builder')}>
            <Ionicons name="create-outline" size={16} color={c.textMuted} />
            <Text style={styles.editTxt}>Editar rutina</Text>
          </Pressable>

          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={18} color={c.info} />
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 12 },
    h1: { color: c.text, fontSize: 22, fontWeight: '800' },
    welcome: { backgroundColor: c.infoSurface, borderRadius: 14, padding: 14 },
    welcomeTxt: { color: c.infoText, fontSize: 13, lineHeight: 19 },
    muted: { color: c.textMuted },
    cta: { backgroundColor: c.accentStrong, borderRadius: 14, padding: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaTxt: { color: c.onAccent, fontWeight: '800', fontSize: 16 },
    hero: { backgroundColor: c.card, borderColor: c.accentStrong, borderWidth: 1, borderRadius: 18, padding: 18, gap: 6 },
    heroLbl: { color: c.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    heroDay: { color: c.text, fontSize: 26, fontWeight: '800' },
    heroPreview: { color: c.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 6 },
    heroBtn: { backgroundColor: c.good, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    heroBtnTxt: { color: c.onGood, fontWeight: '800', fontSize: 16 },
    section: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 4 },
    dayCard: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayName: { color: c.text, fontSize: 16, fontWeight: '700' },
    dayGo: { color: c.accent, fontWeight: '700' },
    edit: { padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 4 },
    editTxt: { color: c.textMuted },
    info: { flexDirection: 'row', gap: 8, backgroundColor: c.infoSurface, borderRadius: 12, padding: 12 },
    infoTxt: { color: c.infoText, fontSize: 12, lineHeight: 18, flex: 1 },
  });
