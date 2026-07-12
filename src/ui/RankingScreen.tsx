import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  computeMyLifts,
  getMyRankingRow,
  joinRanking,
  leaveRanking,
  listLeaderboard,
  refreshMyRanking,
  type LeaderRow,
  type MyLifts,
} from '@/db/ranking-repo';
import { tierForDots } from '@/ranking/score';
import { Termino, useTermSheet } from '@/ui/Termino';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { useRefresh } from '@/ui/useRefresh';

const r0 = (n: number) => Math.round(n);
const dotsTxt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

export function RankingScreen() {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [mine, setMine] = useState<LeaderRow | null>(null);
  const [lifts, setLifts] = useState<MyLifts | null>(null);
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [alias, setAlias] = useState('');
  const [busy, setBusy] = useState(false);
  const { openTerm, sheet } = useTermSheet();

  const load = useCallback(async () => {
    setLifts(await computeMyLifts());
    const row = await getMyRankingRow();
    if (row) await refreshMyRanking();
    setMine(await getMyRankingRow());
    setBoard(await listLeaderboard(100));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { control } = useRefresh(load);

  async function join() {
    setBusy(true);
    const { error } = await joinRanking(alias);
    setBusy(false);
    if (error) {
      Alert.alert('No se pudo unir', error.message);
      return;
    }
    setAlias('');
    load();
  }

  function confirmLeave() {
    Alert.alert('Salir del ranking', 'Se borrará tu entrada del ranking. Puedes volver cuando quieras.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await leaveRanking(); load(); } },
    ]);
  }

  const myPos = mine ? board.findIndex((r) => r.userId === mine.userId) + 1 : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={control}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
          <Ionicons name="chevron-back" size={22} color={c.accent} />
          <Text style={styles.back}>Atrás</Text>
        </Pressable>
      </View>
      <Text style={styles.h1}>🏆 Ranking</Text>
      <Text style={styles.intro}>
        Compite por fuerza relativa (<Termino id="big3" style={styles.intro} onOpen={openTerm}>Big 3</Termino> con{' '}
        <Termino id="dots" style={styles.intro} onOpen={openTerm}>DOTS</Termino>: ajusta por tu peso y sexo, no premia pesar más).
      </Text>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 20 }} />
      ) : mine ? (
        <>
          <View style={styles.myCard}>
            <Text style={styles.myTier}>{lifts ? tierForDots(mine.dots).name : mine.tier}</Text>
            <Text style={styles.myDots}>{dotsTxt(mine.dots)} <Text style={styles.myDotsUnit}>DOTS</Text></Text>
            <Text style={styles.myPos}>{myPos > 0 ? `Puesto #${myPos}` : 'Sin clasificar aún'}</Text>
            <Text style={styles.myLifts}>
              Sentadilla {r0(mine.squat)} · Banca {r0(mine.bench)} · Peso muerto {r0(mine.dead)} kg
            </Text>
            <Pressable hitSlop={8} onPress={confirmLeave}>
              <Text style={styles.leave}>Salir del ranking</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>Clasificación</Text>
          {board.map((row, i) => (
            <View key={row.userId} style={[styles.row, row.userId === mine.userId && styles.rowMe]}>
              <Text style={styles.pos}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alias} numberOfLines={1}>{row.alias}</Text>
                <Text style={styles.rowTier}>{tierForDots(row.dots).name}</Text>
              </View>
              <Text style={styles.rowDots}>{dotsTxt(row.dots)}</Text>
            </View>
          ))}
          {board.length === 0 && <Text style={styles.empty}>Aún no hay nadie en el ranking. ¡Sé el primero!</Text>}
        </>
      ) : (
        <View style={styles.joinCard}>
          {lifts && lifts.complete ? (
            <>
              <Text style={styles.joinTier}>Empezarías en {tierForDots(lifts.dots).name}</Text>
              <Text style={styles.joinDots}>{dotsTxt(lifts.dots)} DOTS</Text>
              <Text style={styles.joinNote}>Al unirte, tu alias y tus cifras del Big 3 serán visibles para otros usuarios (tu correo nunca).</Text>
              <TextInput
                value={alias}
                onChangeText={setAlias}
                placeholder="Tu alias (visible)"
                placeholderTextColor={c.textMuted}
                maxLength={24}
                style={styles.input}
              />
              <Pressable style={[styles.join, busy && { opacity: 0.5 }]} disabled={busy} onPress={join}>
                <Text style={styles.joinBtnTxt}>{busy ? 'Uniéndote…' : 'Unirme al ranking'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.joinTier}>Aún no puntúas</Text>
              <Text style={styles.joinNote}>
                Para competir necesitas registrar tu <Text style={styles.bold}>sentadilla, press banca y peso muerto</Text> (con barra o
                multipower) y tener tu peso corporal. Tu rango sale de tus entrenos reales.
              </Text>
            </>
          )}
        </View>
      )}
      {sheet}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 10, paddingBottom: 40 },
    topBar: { flexDirection: 'row', alignItems: 'center' },
    backRow: { flexDirection: 'row', alignItems: 'center' },
    back: { color: c.accent, fontWeight: '700', fontSize: 15 },
    h1: { color: c.text, fontSize: 22, fontWeight: '800' },
    intro: { color: c.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
    myCard: { backgroundColor: c.card, borderColor: c.accentStrong, borderWidth: 1, borderRadius: 16, padding: 16, gap: 4, alignItems: 'center' },
    myTier: { color: c.accent, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    myDots: { color: c.text, fontSize: 34, fontWeight: '800' },
    myDotsUnit: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    myPos: { color: c.good, fontSize: 14, fontWeight: '700' },
    myLifts: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    leave: { color: c.bad, fontSize: 12, fontWeight: '700', marginTop: 8 },
    section: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
    rowMe: { borderColor: c.accentStrong },
    pos: { color: c.textMuted, fontSize: 15, fontWeight: '800', minWidth: 26, textAlign: 'center' },
    alias: { color: c.text, fontSize: 15, fontWeight: '700' },
    rowTier: { color: c.textMuted, fontSize: 12 },
    rowDots: { color: c.accent, fontSize: 16, fontWeight: '800' },
    empty: { color: c.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
    joinCard: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 8, alignItems: 'center' },
    joinTier: { color: c.accent, fontSize: 15, fontWeight: '800' },
    joinDots: { color: c.text, fontSize: 28, fontWeight: '800' },
    joinNote: { color: c.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
    bold: { color: c.text, fontWeight: '700' },
    input: { alignSelf: 'stretch', color: c.text, fontSize: 16, fontWeight: '700', textAlign: 'center', backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 11, marginTop: 6 },
    join: { alignSelf: 'stretch', backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    joinBtnTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
  });
