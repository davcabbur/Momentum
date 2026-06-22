import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type FoodEntry } from '@/db/food-repo';
import { type FoodTotals, type Macros } from '@/nutrition/macros';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

const r0 = (n: number) => Math.round(n);

/** Detalle nutricional del día: consumido vs objetivo, desglose (azúcares/fibra/saturadas),
 *  reparto calórico y alimentos. */
export function DayDetailSheet({
  visible,
  consumed,
  goals,
  foods,
  onClose,
  onEditGoals,
}: {
  visible: boolean;
  consumed: FoodTotals;
  goals: Macros | null;
  foods: FoodEntry[];
  onClose: () => void;
  onEditGoals?: () => void;
}) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const pK = consumed.protein * 4;
  const cK = consumed.carbs * 4;
  const fK = consumed.fat * 9;
  const macroK = pK + cK + fK || 1;
  const pct = (x: number) => Math.round((x / macroK) * 100);

  type Sub = { label: string; grams: number };
  const carbSubs: Sub[] = [
    ...(consumed.sugars > 0 ? [{ label: 'Azúcares', grams: consumed.sugars }] : []),
    ...(consumed.fiber > 0 ? [{ label: 'Fibra', grams: consumed.fiber }] : []),
  ];
  const fatSubs: Sub[] = consumed.satFat > 0 ? [{ label: 'Saturadas', grams: consumed.satFat }] : [];

  const rows = [
    { key: 'kcal', label: 'Calorías', val: consumed.kcal, goal: goals?.kcal ?? null, unit: 'kcal', color: c.good, subs: [] as Sub[] },
    { key: 'p', label: 'Proteína', val: consumed.protein, goal: goals?.protein ?? null, unit: 'g', color: c.accent, subs: [] as Sub[] },
    { key: 'c', label: 'Carbohidratos', val: consumed.carbs, goal: goals?.carbs ?? null, unit: 'g', color: c.info, subs: carbSubs },
    { key: 'f', label: 'Grasa', val: consumed.fat, goal: goals?.fat ?? null, unit: 'g', color: c.warn, subs: fatSubs },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={() => {}}>
          <View style={styles.head}>
            <Text style={styles.title}>Hoy · detalle nutricional</Text>
            {onEditGoals && (
              <Pressable hitSlop={8} onPress={onEditGoals}>
                <Text style={styles.edit}>Editar objetivos</Text>
              </Pressable>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {rows.map((r) => {
              const remaining = r.goal != null ? r.goal - r.val : null;
              return (
                <View key={r.key} style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowLbl}>{r.label}</Text>
                    <Text style={styles.rowVal}>
                      {r0(r.val)}
                      {r.goal != null ? ` / ${r0(r.goal)}` : ''} {r.unit}
                    </Text>
                  </View>
                  {r.goal != null && (
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${Math.min(100, (r.val / (r.goal || 1)) * 100)}%`, backgroundColor: r.color }]} />
                    </View>
                  )}
                  {remaining != null && (
                    <Text style={[styles.rem, { color: remaining >= 0 ? c.textMuted : c.warn }]}>
                      {remaining >= 0 ? `Te quedan ${r0(remaining)} ${r.unit}` : `Te has pasado ${r0(-remaining)} ${r.unit}`}
                    </Text>
                  )}
                  {r.subs.length > 0 && (
                    <View style={[styles.subBox, { borderLeftColor: r.color }]}>
                      {r.subs.map((sub) => (
                        <View key={sub.label} style={styles.subRow}>
                          <Text style={styles.subLbl}>{sub.label}</Text>
                          <Text style={styles.subVal}>{r0(sub.grams)} g</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            <Text style={styles.section}>Reparto calórico</Text>
            <View style={styles.split}>
              <Text style={[styles.splitItem, { color: c.accent }]}>Proteína {pct(pK)}%</Text>
              <Text style={[styles.splitItem, { color: c.info }]}>Carbos {pct(cK)}%</Text>
              <Text style={[styles.splitItem, { color: c.warn }]}>Grasa {pct(fK)}%</Text>
            </View>

            <Text style={styles.section}>Alimentos de hoy</Text>
            {foods.length === 0 ? (
              <Text style={styles.empty}>Aún no has registrado nada.</Text>
            ) : (
              foods.map((f) => (
                <View key={f.id} style={styles.food}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {f.name}
                    {f.grams ? ` · ${r0(f.grams)} g` : ''}
                  </Text>
                  <Text style={styles.foodMacros}>
                    {r0(f.kcal)} kcal · P {f.protein} · C {f.carbs} · G {f.fat}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    title: { color: c.text, fontSize: 18, fontWeight: '800' },
    edit: { color: c.accent, fontSize: 13, fontWeight: '700' },
    row: { marginBottom: 14 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLbl: { color: c.text, fontSize: 14, fontWeight: '700' },
    rowVal: { color: c.text, fontSize: 13, fontWeight: '700' },
    track: { height: 8, backgroundColor: c.track, borderRadius: 99, overflow: 'hidden', marginTop: 6 },
    fill: { height: '100%', borderRadius: 99 },
    rem: { fontSize: 12, marginTop: 4 },
    subBox: { marginTop: 8, marginLeft: 2, paddingLeft: 12, borderLeftWidth: 2, gap: 4 },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subLbl: { color: c.textMuted, fontSize: 13 },
    subVal: { color: c.accent, fontSize: 13, fontWeight: '700' },
    section: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 6, marginBottom: 8 },
    split: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 12 },
    splitItem: { fontSize: 13, fontWeight: '800' },
    empty: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
    food: { borderTopWidth: 1, borderTopColor: c.cardBorder, paddingVertical: 8 },
    foodName: { color: c.text, fontSize: 14, fontWeight: '600' },
    foodMacros: { color: c.textMuted, fontSize: 12, marginTop: 1 },
  });
