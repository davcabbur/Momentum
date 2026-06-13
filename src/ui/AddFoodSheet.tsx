import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { addFoodEntry } from '@/db/food-repo';
import { portionMacros, type Macros } from '@/nutrition/macros';

function num(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0;
}

export interface FoodPrefill {
  name: string;
  per100: Macros;
  barcode?: string;
}

interface Props {
  visible: boolean;
  date: string;
  prefill?: FoodPrefill | null;
  onClose: () => void;
}

/** Alta manual de alimento por valores por 100 g (como las etiquetas). */
export function AddFoodSheet({ visible, date, prefill, onClose }: Props) {
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('100');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [barcode, setBarcode] = useState<string | null>(null);

  function reset() {
    setName('');
    setGrams('100');
    setKcal('');
    setProt('');
    setCarb('');
    setFat('');
    setBarcode(null);
  }

  // Al abrir, prerellenar desde el escáner (o limpiar para alta manual).
  useEffect(() => {
    if (!visible) return;
    if (prefill) {
      setName(prefill.name);
      setGrams('100');
      setKcal(String(prefill.per100.kcal));
      setProt(String(prefill.per100.protein));
      setCarb(String(prefill.per100.carbs));
      setFat(String(prefill.per100.fat));
      setBarcode(prefill.barcode ?? null);
    } else {
      reset();
    }
  }, [visible, prefill]);

  const g = num(grams);
  const per100 = { kcal: num(kcal), protein: num(prot), carbs: num(carb), fat: num(fat) };
  const preview = portionMacros(per100, g);
  const canSave = name.trim().length > 0 && g > 0 && num(kcal) > 0;

  async function save() {
    if (!canSave) return;
    await addFoodEntry({
      date,
      name: name.trim(),
      grams: g,
      kcal: preview.kcal,
      protein: preview.protein,
      carbs: preview.carbs,
      fat: preview.fat,
      barcode,
    });
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Añadir alimento</Text>

            <Text style={styles.lbl}>Nombre</Text>
            <TextInput value={name} onChangeText={setName} placeholder="p. ej. Avena" placeholderTextColor={Brand.textMuted} style={styles.input} />

            <Text style={styles.lbl}>Ración (gramos)</Text>
            <TextInput value={grams} onChangeText={setGrams} keyboardType="decimal-pad" placeholder="g" placeholderTextColor={Brand.textMuted} style={styles.input} />

            <Text style={styles.section}>Por 100 g (de la etiqueta)</Text>
            <View style={styles.grid}>
              <Field label="Kcal" value={kcal} onChange={setKcal} />
              <Field label="Proteína" value={prot} onChange={setProt} />
              <Field label="Carbos" value={carb} onChange={setCarb} />
              <Field label="Grasa" value={fat} onChange={setFat} />
            </View>

            <Text style={styles.preview}>
              Ración: {preview.kcal} kcal · P {preview.protein} · C {preview.carbs} · G {preview.fat}
            </Text>

            <Pressable style={[styles.save, !canSave && styles.saveOff]} disabled={!canSave} onPress={save}>
              <Text style={styles.saveTxt}>Añadir</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLbl}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Brand.textMuted} style={styles.fieldInput} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  sheet: { backgroundColor: Brand.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  title: { color: Brand.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  lbl: { color: Brand.textMuted, fontSize: 12, marginTop: 8 },
  section: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 14 },
  input: { color: Brand.text, fontSize: 18, fontWeight: '700', backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  field: { flexBasis: '47%', flexGrow: 1 },
  fieldLbl: { color: Brand.textMuted, fontSize: 12 },
  fieldInput: { color: Brand.text, fontSize: 16, fontWeight: '700', backgroundColor: Brand.surface, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginTop: 4 },
  preview: { color: Brand.accent, fontSize: 13, fontWeight: '700', marginTop: 12 },
  save: { backgroundColor: Brand.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  saveOff: { opacity: 0.4 },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
