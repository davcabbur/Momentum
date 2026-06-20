import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { deleteWeight, upsertWeight } from '@/db/bodyweight-repo';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

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
  const styles = useThemedStyles(makeStyles);
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: {
      backgroundColor: c.card,
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      gap: 12,
    },
    title: { color: c.text, fontSize: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepTxt: { color: c.accent, fontSize: 26, fontWeight: '700' },
    input: {
      flex: 1,
      color: c.text,
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingVertical: 10,
    },
    save: { backgroundColor: c.good, borderRadius: 12, padding: 14 },
    saveTxt: { textAlign: 'center', fontWeight: '800', color: c.onGood },
    delete: { padding: 10 },
    deleteTxt: { textAlign: 'center', color: c.bad, fontWeight: '700' },
  });
