import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDate, parseDmy } from '@/bodyweight/format';
import { addDays } from '@/bodyweight/goal';
import { Brand } from '@/constants/theme';
import { clearGoal, setGoal } from '@/db/bodyweight-repo';

interface Props {
  visible: boolean;
  initialTargetKg: number;
  /** Fecha objetivo inicial (YYYY-MM-DD). */
  initialTargetDate: string;
  /** Peso de partida (tendencia actual) desde el que se mide el progreso. */
  startKg: number;
  /** Fecha de inicio del objetivo (YYYY-MM-DD). */
  startDate: string;
  /** Si ya hay un objetivo (habilita "Borrar objetivo"). */
  canClear: boolean;
  onClose: () => void;
}

export function SetGoalSheet({ visible, initialTargetKg, initialTargetDate, startKg, startDate, canClear, onClose }: Props) {
  const [value, setValue] = useState(String(initialTargetKg));
  const [dateStr, setDateStr] = useState(formatDate(initialTargetDate));

  useEffect(() => {
    if (visible) {
      setValue(String(initialTargetKg));
      setDateStr(formatDate(initialTargetDate));
    }
  }, [visible, initialTargetKg, initialTargetDate]);

  async function save() {
    const kg = parseFloat(value.replace(',', '.'));
    const targetIso = parseDmy(dateStr) ?? addDays(startDate, 84);
    if (!Number.isNaN(kg) && kg > 0) {
      await setGoal(kg, startKg, startDate, targetIso);
    }
    onClose();
  }

  async function remove() {
    await clearGoal();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>🎯 Tu objetivo</Text>
          <Text style={styles.hint}>
            Guía orientativa, no una fecha límite. La estimación a tu ritmo real se recalcula sola con tus pesajes.
          </Text>
          <Text style={styles.label}>Peso objetivo (kg)</Text>
          <TextInput value={value} onChangeText={setValue} keyboardType="decimal-pad" selectTextOnFocus style={styles.input} />
          <Text style={styles.label}>Fecha objetivo</Text>
          <TextInput value={dateStr} onChangeText={setDateStr} placeholder="DD/MM/AAAA" placeholderTextColor={Brand.textMuted} style={styles.input} />
          <Pressable style={styles.save} onPress={save}>
            <Text style={styles.saveTxt}>Guardar objetivo</Text>
          </Pressable>
          {canClear && (
            <Pressable style={styles.delete} onPress={remove}>
              <Text style={styles.deleteTxt}>Borrar objetivo</Text>
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
    gap: 8,
  },
  title: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  hint: { color: Brand.textMuted, fontSize: 12, marginBottom: 4 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '600', marginTop: 6 },
  input: {
    color: Brand.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: Brand.surface,
    borderRadius: 12,
    paddingVertical: 10,
  },
  save: { backgroundColor: Brand.accentStrong, borderRadius: 12, padding: 14, marginTop: 8 },
  saveTxt: { textAlign: 'center', fontWeight: '800', color: '#fff' },
  delete: { padding: 10 },
  deleteTxt: { textAlign: 'center', color: '#f87171', fontWeight: '700' },
});
