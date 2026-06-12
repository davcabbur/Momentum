import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { deleteWeight, upsertWeight } from '@/db/bodyweight-repo';

interface Props {
  visible: boolean;
  /** Fecha del pesaje (YYYY-MM-DD). */
  date: string;
  initialKg: number;
  /** Si ya existe un pesaje ese día (habilita "Borrar"). */
  isExisting: boolean;
  onClose: () => void;
}

function prettyDate(iso: string): string {
  const todayIso = new Date().toISOString().slice(0, 10);
  if (iso === todayIso) return 'hoy';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function AddWeightSheet({ visible, date, initialKg, isExisting, onClose }: Props) {
  const [value, setValue] = useState(String(initialKg));

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

  async function remove() {
    await deleteWeight(date);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Peso de {prettyDate(date)} (kg)</Text>
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
          {isExisting && (
            <Pressable style={styles.delete} onPress={remove}>
              <Text style={styles.deleteTxt}>Borrar este pesaje</Text>
            </Pressable>
          )}
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
    gap: 12,
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
  delete: { padding: 10 },
  deleteTxt: { textAlign: 'center', color: '#f87171', fontWeight: '700' },
});
