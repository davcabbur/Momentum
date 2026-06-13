import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { updateDayExerciseScheme } from '@/db/routine-repo';

interface Props {
  visible: boolean;
  rdeId: number;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  onClose: () => void;
}

function Stepper({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min: number }) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepCtl}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.stepTxt}>−</Text>
        </Pressable>
        <Text style={styles.stepVal}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={() => onChange(value + 1)}>
          <Text style={styles.stepTxt}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SchemeEditSheet({ visible, rdeId, name, sets, repMin, repMax, onClose }: Props) {
  const [s, setS] = useState(sets);
  const [lo, setLo] = useState(repMin);
  const [hi, setHi] = useState(repMax);

  useEffect(() => {
    if (visible) {
      setS(sets);
      setLo(repMin);
      setHi(repMax);
    }
  }, [visible, sets, repMin, repMax]);

  async function save() {
    await updateDayExerciseScheme(rdeId, { targetSets: s, repMin: lo, repMax: Math.max(lo, hi) });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{name}</Text>
          <Stepper label="Series" value={s} onChange={setS} min={1} />
          <Stepper label="Reps mínimas" value={lo} onChange={setLo} min={1} />
          <Stepper label="Reps máximas" value={hi} onChange={setHi} min={1} />
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
  sheet: { backgroundColor: Brand.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 10 },
  title: { color: Brand.text, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { color: Brand.text, fontSize: 15 },
  stepCtl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Brand.cardBorder, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: Brand.accent, fontSize: 22, fontWeight: '700' },
  stepVal: { color: Brand.text, fontSize: 20, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  save: { backgroundColor: Brand.good, borderRadius: 12, padding: 14, marginTop: 6 },
  saveTxt: { textAlign: 'center', color: '#06240f', fontWeight: '800' },
});
