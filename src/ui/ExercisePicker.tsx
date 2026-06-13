import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { addExercise, listExercises, type Exercise } from '@/db/exercise-repo';

interface Props {
  visible: boolean;
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ visible, onPick, onClose }: Props) {
  const [items, setItems] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setItems(await listExercises());
  }
  useEffect(() => {
    if (visible) load();
  }, [visible]);

  async function create() {
    if (name.trim()) {
      await addExercise(name.trim(), 'otro', 'otro');
      setName('');
      setShowNew(false);
      await load();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Elige un ejercicio</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {items.map((e) => (
              <Pressable key={e.id} style={styles.row} onPress={() => onPick(e)}>
                <Text style={styles.exName}>{e.name}</Text>
                <Text style={styles.exGroup}>{e.muscleGroup}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {showNew ? (
            <View style={styles.newBox}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre del ejercicio"
                placeholderTextColor={Brand.textMuted}
                style={styles.input}
              />
              <Pressable style={styles.save} onPress={create}>
                <Text style={styles.saveTxt}>Crear</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.newBtn} onPress={() => setShowNew(true)}>
              <Text style={styles.newTxt}>＋ Nuevo ejercicio</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  sheet: { backgroundColor: Brand.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 10 },
  title: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Brand.cardBorder },
  exName: { color: Brand.text, fontSize: 15 },
  exGroup: { color: Brand.textMuted, fontSize: 12, textTransform: 'capitalize' },
  newBox: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, color: Brand.text, backgroundColor: Brand.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  save: { backgroundColor: Brand.good, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  saveTxt: { color: '#06240f', fontWeight: '800' },
  newBtn: { padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Brand.cardBorder, borderStyle: 'dashed', borderRadius: 10 },
  newTxt: { color: Brand.accent, fontWeight: '700' },
});
