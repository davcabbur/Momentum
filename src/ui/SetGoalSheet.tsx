import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { setGoal } from '@/db/bodyweight-repo';

interface Props {
  visible: boolean;
  initialTargetKg: number;
  /** Peso de partida (tendencia actual) desde el que se mide el progreso. */
  startKg: number;
  /** Fecha de inicio del objetivo (YYYY-MM-DD). */
  startDate: string;
  onClose: () => void;
}

export function SetGoalSheet({ visible, initialTargetKg, startKg, startDate, onClose }: Props) {
  const [value, setValue] = useState(String(initialTargetKg));

  useEffect(() => {
    if (visible) setValue(String(initialTargetKg));
  }, [visible, initialTargetKg]);

  async function save() {
    const kg = parseFloat(value.replace(',', '.'));
    if (!Number.isNaN(kg) && kg > 0) {
      await setGoal(kg, startKg, startDate);
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>🎯 Tu objetivo de peso (kg)</Text>
          <Text style={styles.hint}>
            Es una guía orientativa, no una fecha límite. La estimación se recalcula sola con tus pesajes.
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={styles.input}
          />
          <Pressable style={styles.save} onPress={save}>
            <Text style={styles.saveTxt}>Guardar objetivo</Text>
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
    gap: 12,
  },
  title: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  hint: { color: Brand.textMuted, fontSize: 12 },
  input: {
    color: Brand.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: Brand.surface,
    borderRadius: 12,
    paddingVertical: 10,
  },
  save: { backgroundColor: Brand.accentStrong, borderRadius: 12, padding: 14 },
  saveTxt: { textAlign: 'center', fontWeight: '800', color: '#fff' },
});
