import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addExercise, listExercises, type Exercise } from '@/db/exercise-repo';
import { recommendForMuscle, type EquipmentScope } from '@/training/recommend';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

interface Props {
  visible: boolean;
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}

const SCOPES: { key: EquipmentScope; label: string }[] = [
  { key: 'gym', label: 'Gimnasio' },
  { key: 'dumbbell', label: 'Mancuernas' },
  { key: 'bodyweight', label: 'Peso corporal' },
];

export function ExercisePicker({ visible, onPick, onClose }: Props) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [scope, setScope] = useState<EquipmentScope>('gym');

  async function load() {
    setItems(await listExercises());
  }
  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const muscles = useMemo(() => [...new Set(items.map((e) => e.muscleGroup))].sort(), [items]);

  // Lista mostrada: si hay filtro, ese músculo con los recomendados primero (✨).
  const { list, recSet } = useMemo(() => {
    if (!filter) return { list: items, recSet: new Set<string>() };
    const recNames = recommendForMuscle(items, filter, { scope });
    const recSet = new Set(recNames);
    const ofMuscle = items.filter((e) => e.muscleGroup === filter);
    const rest = ofMuscle.filter((e) => !recSet.has(e.name));
    const recItems = recNames.map((n) => ofMuscle.find((e) => e.name === n)).filter((e): e is Exercise => !!e);
    return { list: [...recItems, ...rest], recSet };
  }, [items, filter, scope]);

  async function create() {
    if (name.trim()) {
      await addExercise(name.trim(), filter ?? 'otro', 'otro');
      setName('');
      setShowNew(false);
      await load();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={() => {}}>
          <Text style={styles.title}>Elige un ejercicio</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Pressable style={[styles.chip, !filter && styles.chipOn]} onPress={() => setFilter(null)}>
              <Text style={[styles.chipTxt, !filter && styles.chipTxtOn]}>Todos</Text>
            </Pressable>
            {muscles.map((m) => (
              <Pressable key={m} style={[styles.chip, filter === m && styles.chipOn]} onPress={() => setFilter(m)}>
                <Text style={[styles.chipTxt, filter === m && styles.chipTxtOn]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {filter && (
            <View style={styles.scopeRow}>
              <Text style={styles.scopeLbl}>Material:</Text>
              {SCOPES.map((s) => (
                <Pressable key={s.key} style={[styles.scope, scope === s.key && styles.chipOn]} onPress={() => setScope(s.key)}>
                  <Text style={[styles.scopeTxt, scope === s.key && styles.chipTxtOn]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <ScrollView style={{ maxHeight: 340 }}>
            {filter && recSet.size > 0 && <Text style={styles.recHdr}>✨ Recomendados</Text>}
            {list.map((e, i) => {
              const isRec = recSet.has(e.name);
              const firstNonRec = filter && recSet.size > 0 && i === recSet.size;
              return (
                <View key={e.id}>
                  {firstNonRec && <Text style={styles.recHdr}>Otros</Text>}
                  <Pressable style={styles.row} onPress={() => onPick(e)}>
                    <Text style={styles.exName}>
                      {isRec ? '✨ ' : ''}
                      {e.name}
                    </Text>
                    <Text style={styles.exGroup}>{e.muscleGroup}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          {showNew ? (
            <View style={styles.newBox}>
              <TextInput value={name} onChangeText={setName} placeholder="Nombre del ejercicio" placeholderTextColor={c.textMuted} style={styles.input} />
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 10 },
    title: { color: c.text, fontSize: 16, fontWeight: '700' },
    chips: { gap: 6, paddingVertical: 2 },
    chip: { backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 9, paddingVertical: 7, paddingHorizontal: 12 },
    chipOn: { borderColor: c.accentStrong, backgroundColor: c.accentSurface },
    chipTxt: { color: c.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
    chipTxtOn: { color: c.text },
    scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    scopeLbl: { color: c.textMuted, fontSize: 12 },
    scope: { backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 9, paddingVertical: 6, paddingHorizontal: 10 },
    scopeTxt: { color: c.textMuted, fontWeight: '700', fontSize: 12 },
    recHdr: { color: c.accent, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 8, marginBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    exName: { color: c.text, fontSize: 15 },
    exGroup: { color: c.textMuted, fontSize: 12, textTransform: 'capitalize' },
    newBox: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: { flex: 1, color: c.text, backgroundColor: c.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    save: { backgroundColor: c.good, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
    saveTxt: { color: c.onGood, fontWeight: '800' },
    newBtn: { padding: 12, alignItems: 'center', borderWidth: 1, borderColor: c.cardBorder, borderStyle: 'dashed', borderRadius: 10 },
    newTxt: { color: c.accent, fontWeight: '700' },
  });
