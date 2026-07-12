import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listExercises, type Exercise } from '@/db/exercise-repo';
import { getSetting } from '@/db/settings-repo';
import { substitutesFor } from '@/training/substitutes';
import type { EquipmentScope } from '@/training/recommend';
import { useThemedStyles, type Theme } from '@/ui/theme';

interface Props {
  visible: boolean;
  exerciseName: string;
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}

/** Equivalentes para sustituir un ejercicio: mismo músculo, ordenados por afinidad. */
export function SubstituteSheet({ visible, exerciseName, onPick, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<{ ex: Exercise; reason: string }[]>([]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const all = await listExercises();
      let scope: EquipmentScope = 'gym';
      const prefs = await getSetting('generatorPrefs');
      if (prefs) {
        try {
          const p = JSON.parse(prefs);
          if (p.scope === 'dumbbell' || p.scope === 'bodyweight') scope = p.scope;
        } catch {}
      }
      const subs = substitutesFor(exerciseName, all, scope);
      const byName = new Map(all.map((e) => [e.name, e]));
      setItems(subs.flatMap((s) => (byName.has(s.name) ? [{ ex: byName.get(s.name)!, reason: s.reason }] : [])));
    })();
  }, [visible, exerciseName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <Text style={styles.title}>Cambiar «{exerciseName}»</Text>
          {items.length === 0 && <Text style={styles.emptyTxt}>No encuentro un equivalente claro con tu material. Prueba el catálogo completo desde la rutina.</Text>}
          <ScrollView style={{ maxHeight: 380 }}>
            {items.map((it) => (
              <Pressable key={it.ex.id} style={styles.row} onPress={() => onPick(it.ex)}>
                <Text style={styles.name}>{it.ex.name}</Text>
                <Text style={styles.reason}>{it.reason}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    // Backdrop '#0008': patrón existente de sheets (excepción admitida al tema).
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 8 },
    title: { color: c.text, fontSize: 17, fontWeight: '800' },
    emptyTxt: { color: c.textMuted, fontSize: 13, lineHeight: 19 },
    row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    name: { color: c.text, fontSize: 15, fontWeight: '600' },
    reason: { color: c.textMuted, fontSize: 12, marginTop: 2 },
  });
