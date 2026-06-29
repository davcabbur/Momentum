import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setStepsGoal, upsertActivityDay } from '@/db/activity-repo';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

export function StepsSheet({
  visible,
  date,
  initialGoal,
  initialSteps,
  onClose,
}: {
  visible: boolean;
  date: string;
  initialGoal: number;
  initialSteps: number;
  onClose: () => void;
}) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [steps, setSteps] = useState(String(initialSteps || ''));
  const [goal, setGoal] = useState(String(initialGoal));

  useEffect(() => {
    if (visible) {
      setSteps(initialSteps ? String(initialSteps) : '');
      setGoal(String(initialGoal));
    }
  }, [visible, initialSteps, initialGoal]);

  async function save() {
    const s = Math.round(Number(steps.replace(',', '.')));
    const g = Math.round(Number(goal.replace(',', '.')));
    if (Number.isFinite(s) && s > 0) await upsertActivityDay(date, s, 'manual');
    if (Number.isFinite(g) && g > 0) await setStepsGoal(g);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={() => {}}>
          <Text style={styles.title}>Pasos de hoy</Text>
          <Text style={styles.label}>Pasos de hoy</Text>
          <TextInput value={steps} onChangeText={setSteps} keyboardType="number-pad" placeholder="p. ej. 7500" placeholderTextColor={c.textMuted} style={styles.input} />
          <Text style={styles.label}>Meta diaria</Text>
          <TextInput value={goal} onChangeText={setGoal} keyboardType="number-pad" style={styles.input} />
          <Pressable style={styles.save} onPress={save}>
            <Text style={styles.saveTxt}>Guardar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 8 },
    title: { color: c.text, fontSize: 16, fontWeight: '700' },
    label: { color: c.textMuted, fontSize: 13, fontWeight: '600', marginTop: 6 },
    input: { color: c.text, fontSize: 22, fontWeight: '800', textAlign: 'center', backgroundColor: c.surface, borderRadius: 12, paddingVertical: 10 },
    save: { backgroundColor: c.accentStrong, borderRadius: 12, padding: 14, marginTop: 8 },
    saveTxt: { textAlign: 'center', fontWeight: '800', color: c.onAccent },
  });
