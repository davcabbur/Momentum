import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

/** Estilos compartidos por el menú de Ajustes y sus subpantallas. */
export const makeAjustesStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 8, paddingBottom: 40 },
    headerWrap: { gap: 4, marginBottom: 4 },
    backRow: { flexDirection: 'row', alignItems: 'center' },
    back: { color: c.accent, fontWeight: '700', fontSize: 15 },
    h1: { color: c.text, fontSize: 22, fontWeight: '800' },
    intro: { color: c.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
    // Filas del menú
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 15 },
    menuIcon: { width: 26, textAlign: 'center' },
    menuLabel: { color: c.text, fontSize: 15, fontWeight: '600', flex: 1 },
    // Tarjetas y controles
    section: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 10 },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
    lbl: { color: c.textMuted, fontSize: 12, marginTop: 4 },
    row: { flexDirection: 'row', gap: 8 },
    twoCol: { flexDirection: 'row', gap: 10 },
    wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    pill: { flex: 1, backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    pillOn: { borderColor: c.accentStrong, backgroundColor: c.accentSurface },
    pillTxt: { color: c.textMuted, fontWeight: '700', fontSize: 13 },
    pillTxtOn: { color: c.text },
    chip: { backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
    chipTxt: { color: c.textMuted, fontWeight: '700', fontSize: 13 },
    input: { color: c.text, fontSize: 18, fontWeight: '700', backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
    save: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
    saveTxt: { color: c.onAccent, fontWeight: '800' },
    secondary: { borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    secondaryTxt: { color: c.accent, fontWeight: '700' },
    danger: { borderColor: c.bad, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    dangerTxt: { color: c.bad, fontWeight: '700' },
    note: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    switchLbl: { color: c.text, fontSize: 15, fontWeight: '600' },
    hourRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hourBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    hourBtnTxt: { color: c.accent, fontSize: 22, fontWeight: '700' },
    hourVal: { color: c.text, fontSize: 18, fontWeight: '800', minWidth: 64, textAlign: 'center' },
    linkRow: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    linkTxt: { color: c.text, fontSize: 15, fontWeight: '600' },
    aboutMain: { color: c.text, fontSize: 14, fontWeight: '700' },
    aboutSub: { color: c.textMuted, fontSize: 12 },
  });

export function useAjustesStyles() {
  return useThemedStyles(makeAjustesStyles);
}

/** Cabecera común de subpantalla: flecha "Atrás" + título. */
export function SettingHeader({ title }: { title: string }) {
  const { c } = useTheme();
  const styles = useAjustesStyles();
  const router = useRouter();
  return (
    <View style={styles.headerWrap}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
        <Ionicons name="chevron-back" size={22} color={c.accent} />
        <Text style={styles.back}>Atrás</Text>
      </Pressable>
      <Text style={styles.h1}>{title}</Text>
    </View>
  );
}
