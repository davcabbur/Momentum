import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getHistoryRows } from '@/db/workout-repo';
import { buildProgress, type ExerciseProgress } from '@/training/progression';
import { detectStall, deloadAdvice } from '@/training/intelligence';
import { LineChart } from './LineChart';
import { useTheme, useThemedStyles, type Theme } from './theme';
import { useRefresh } from './useRefresh';
import { WeightDetail } from './WeightDetail';
import { WeightHistory } from './WeightHistory';

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

type Tab = 'fuerza' | 'peso';

export function ProgresoScreen() {
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [items, setItems] = useState<ExerciseProgress[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>(tabParam === 'peso' ? 'peso' : 'fuerza');
  const [open, setOpen] = useState<Set<number>>(new Set());

  // Abre la pestaña que pida la navegación (p. ej. desde Inicio → "Ver gráfica e historial").
  useFocusEffect(
    useCallback(() => {
      if (tabParam === 'peso' || tabParam === 'fuerza') setTab(tabParam);
    }, [tabParam]),
  );

  const load = useCallback(async () => {
    const rows = await getHistoryRows();
    setItems(buildProgress(rows));
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { control, nonce } = useRefresh(load);

  function toggle(id: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={control}>
      <Text style={styles.h1}>Progreso</Text>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'fuerza' && styles.tabOn]} onPress={() => setTab('fuerza')}>
          <Ionicons name="barbell-outline" size={16} color={tab === 'fuerza' ? c.text : c.textMuted} />
          <Text style={[styles.tabTxt, tab === 'fuerza' && styles.tabTxtOn]}>Fuerza</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'peso' && styles.tabOn]} onPress={() => setTab('peso')}>
          <Ionicons name="trending-up-outline" size={16} color={tab === 'peso' ? c.text : c.textMuted} />
          <Text style={[styles.tabTxt, tab === 'peso' && styles.tabTxtOn]}>Peso corporal</Text>
        </Pressable>
      </View>

      {tab === 'fuerza' ? (
        <>
          <Pressable style={styles.histBtn} onPress={() => router.push('/historial')}>
            <Ionicons name="calendar-outline" size={18} color={c.accent} />
            <Text style={styles.histTxt}>Historial de sesiones</Text>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>

          {loaded && items.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>Aún no hay sesiones registradas. Entrena y registra tus series para ver aquí tu progreso. 💪</Text>
            </View>
          )}

          {items.map((ex) => {
            const isOpen = open.has(ex.exerciseId);
            const latest = ex.points[ex.points.length - 1];
            const prev = ex.points.length >= 2 ? ex.points[ex.points.length - 2] : null;
            const diff = prev ? Math.round((latest.e1rm - prev.e1rm) * 10) / 10 : null;
            const dir = diff == null ? 0 : Math.sign(diff);
            const diffStr = diff == null ? '' : `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${fmt(Math.abs(diff))} kg`;
            const advice = deloadAdvice(ex.name, detectStall(ex.points.map((p) => p.e1rm)));
            return (
              <View key={ex.exerciseId} style={styles.card}>
                <Pressable style={styles.head} onPress={() => toggle(ex.exerciseId)}>
                  <Text style={styles.name} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.headKg}>{fmt(latest.e1rm)} kg</Text>
                  {prev && (
                    <View style={styles.diffWrap}>
                      <Ionicons
                        name={dir > 0 ? 'arrow-up' : dir < 0 ? 'arrow-down' : 'remove'}
                        size={14}
                        color={dir > 0 ? c.good : c.textMuted}
                      />
                      <Text style={[styles.diffTxt, { color: dir > 0 ? c.good : c.textMuted }]}>{diffStr}</Text>
                    </View>
                  )}
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
                </Pressable>

                {isOpen && (
                  <View style={styles.body}>
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Text style={styles.statVal}>{fmt(ex.bestE1rm)} kg</Text>
                        <Text style={styles.statLbl}>PR (1RM est.)</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statVal}>{fmt(latest.e1rm)} kg</Text>
                        <Text style={styles.statLbl}>1RM actual</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statVal}>{fmt(latest.volume)}</Text>
                        <Text style={styles.statLbl}>Volumen últ.</Text>
                      </View>
                    </View>
                    {ex.points.length >= 2 ? (
                      <LineChart values={ex.points.map((p) => p.e1rm)} />
                    ) : (
                      <Text style={styles.note}>Necesitas otra sesión para ver la tendencia.</Text>
                    )}
                    {advice && <Text style={styles.deload}>🔋 {advice.text}</Text>}
                  </View>
                )}
              </View>
            );
          })}
        </>
      ) : (
        <>
          <WeightDetail reloadNonce={nonce} />
          <WeightHistory reloadNonce={nonce} />
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 10 },
    h1: { color: c.text, fontSize: 20, fontWeight: '800' },
    tabs: { flexDirection: 'row', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
    tabOn: { backgroundColor: c.accentSurface },
    tabTxt: { color: c.textMuted, fontWeight: '700', fontSize: 13 },
    tabTxtOn: { color: c.text },
    empty: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 18 },
    emptyTxt: { color: c.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { color: c.text, fontSize: 15, fontWeight: '700', flex: 1 },
    headKg: { color: c.accent, fontSize: 15, fontWeight: '800' },
    diffWrap: { flexDirection: 'row', alignItems: 'center', gap: 1, minWidth: 64, justifyContent: 'flex-end' },
    diffTxt: { fontSize: 13, fontWeight: '700' },
    body: { gap: 10, marginTop: 12 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { alignItems: 'center', flex: 1 },
    statVal: { color: c.accent, fontSize: 17, fontWeight: '800' },
    statLbl: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    note: { color: c.textMuted, fontSize: 12, fontStyle: 'italic' },
    deload: { color: c.warn, fontSize: 12, lineHeight: 18, marginTop: 2 },
    histBtn: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    histTxt: { color: c.text, fontSize: 15, fontWeight: '600', flex: 1 },
  });
