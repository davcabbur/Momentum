import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { upsertWeight } from '@/db/bodyweight-repo';

interface Props {
  visible: boolean;
  initialKg: number;
  /** Fecha del pesaje (YYYY-MM-DD). La decide la pantalla, no la lógica pura. */
  date: string;
  onClose: () => void;
}

export function AddWeightSheet({ visible, initialKg, date, onClose }: Props) {
  const [value, setValue] = useState(String(initialKg));

  // Resincroniza el valor inicial cada vez que se abre la hoja.
  useEffect(() => {
    if (visible) setValue(String(initialKg));
  }, [visible, initialKg]);

  function step(delta: number) {
    const current = parseFloat(value.replace(',', '.'));
    const next = (Number.isNaN(current) ? initialKg : current) + delta;
    setValue(next.toFixed(1));
  }

  async function save() {
    const kg = parseFloat(value.replace(',', '.'));
    if (!Number.isNaN(kg) && kg > 0) {
      await upsertWeight(date, kg);
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Peso de hoy (kg)</Text>
          <View style={styles.row}>
            <Pressable style={styles.stepBtn} onPress={() => step(-0.1)}>
              <Text style={styles.stepTxt}>−</Text>
            </Pressable>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={styles.input}
            />
            <Pressable style={styles.stepBtn} onPress={() => step(0.1)}>
              <Text style={styles.stepTxt}>+</Text>
            </Pressable>
          </View>
          <Pressable style={styles.save} onPress={save}>
            <Text style={styles.saveTxt}>Guardar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  sheet: {
    backgroundColor: Brand.card,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 14,
  },
  title: { color: Brand.text, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Brand.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: { color: Brand.accent, fontSize: 26, fontWeight: '700' },
  input: {
    flex: 1,
    color: Brand.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: Brand.surface,
    borderRadius: 12,
    paddingVertical: 10,
  },
  save: { backgroundColor: Brand.good, borderRadius: 12, padding: 14 },
  saveTxt: { textAlign: 'center', fontWeight: '800', color: '#06240f' },
});
