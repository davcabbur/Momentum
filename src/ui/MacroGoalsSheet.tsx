import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setCustomMacros } from '@/nutrition/custom-targets';
import { type Macros } from '@/nutrition/macros';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

function num(s: string): number {
  return Math.max(0, Math.round(parseFloat(s.replace(',', '.')) || 0));
}

/** Editar a mano los objetivos diarios de kcal y macros (o volver al automático). */
export function MacroGoalsSheet({ visible, initial, isCustom, onClose }: { visible: boolean; initial: Macros; isCustom: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    if (!visible) return;
    setKcal(String(Math.round(initial.kcal)));
    setProt(String(Math.round(initial.protein)));
    setCarb(String(Math.round(initial.carbs)));
    setFat(String(Math.round(initial.fat)));
  }, [visible, initial]);

  async function save() {
    await setCustomMacros({ kcal: num(kcal), protein: num(prot), carbs: num(carb), fat: num(fat) });
    onClose();
  }

  async function auto() {
    await setCustomMacros(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={() => {}}>
          <Text style={styles.title}>Tus objetivos diarios</Text>
          <Text style={styles.note}>Ajusta tus kcal y macros a tu gusto; se usarán en lugar del cálculo automático.</Text>
          <View style={styles.grid}>
            <Field label="Kcal" value={kcal} onChange={setKcal} />
            <Field label="Proteína (g)" value={prot} onChange={setProt} />
            <Field label="Carbos (g)" value={carb} onChange={setCarb} />
            <Field label="Grasa (g)" value={fat} onChange={setFat} />
          </View>
          <Pressable style={styles.save} onPress={save}>
            <Text style={styles.saveTxt}>Guardar mis objetivos</Text>
          </Pressable>
          {isCustom && (
            <Pressable style={styles.secondary} onPress={auto}>
              <Text style={styles.secondaryTxt}>Volver al cálculo automático</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLbl}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="0" placeholderTextColor={c.textMuted} style={styles.fieldInput} />
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    title: { color: c.text, fontSize: 18, fontWeight: '800' },
    note: { color: c.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    field: { flexBasis: '47%', flexGrow: 1 },
    fieldLbl: { color: c.textMuted, fontSize: 12 },
    fieldInput: { color: c.text, fontSize: 18, fontWeight: '700', backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
    save: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    saveTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
    secondary: { borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    secondaryTxt: { color: c.accent, fontWeight: '700' },
  });
