import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDate, parseDmy } from '@/bodyweight/format';
import { addDays, estimateTargetDate } from '@/bodyweight/goal';
import { clearGoal, setGoal } from '@/db/bodyweight-repo';
import { DateField } from '@/ui/DateField';
import { useThemedStyles, type Theme } from '@/ui/theme';

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
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(String(initialTargetKg));
  const [dateStr, setDateStr] = useState(formatDate(initialTargetDate));

  useEffect(() => {
    if (visible) {
      setValue(String(initialTargetKg));
      setDateStr(formatDate(initialTargetDate));
    }
  }, [visible, initialTargetKg, initialTargetDate]);

  // Fecha que el cálculo automático propondría para el peso objetivo actual.
  const targetKg = parseFloat(value.replace(',', '.'));
  const autoIso =
    !Number.isNaN(targetKg) && targetKg > 0
      ? estimateTargetDate({ initialKg: startKg, targetKg, startDate })
      : null;
  // Si la fecha actual ya coincide con la automática, no hace falta ofrecer "volver a la automática".
  const isAuto = autoIso != null && (parseDmy(dateStr) ?? '') === autoIso;

  function useAutoDate() {
    if (autoIso) setDateStr(formatDate(autoIso));
  }

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
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={() => {}}>
          <Text style={styles.title}>🎯 Tu objetivo</Text>
          <Text style={styles.hint}>
            Guía orientativa, no una fecha límite. La estimación a tu ritmo real se recalcula sola con tus pesajes.
          </Text>
          <Text style={styles.label}>Peso objetivo (kg)</Text>
          <TextInput value={value} onChangeText={setValue} keyboardType="decimal-pad" selectTextOnFocus style={styles.input} />
          <View style={styles.dateHead}>
            <Text style={styles.label}>Fecha objetivo</Text>
            {autoIso && !isAuto && (
              <Pressable hitSlop={8} onPress={useAutoDate}>
                <Text style={styles.autoTxt}>↺ Cálculo automático</Text>
              </Pressable>
            )}
          </View>
          <DateField value={dateStr} onChange={setDateStr} />
          {autoIso && (
            <Text style={styles.autoHint}>
              {isAuto ? 'Fecha calculada a tu ritmo saludable.' : `A ritmo saludable saldría el ${formatDate(autoIso)}.`}
            </Text>
          )}
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: {
      backgroundColor: c.card,
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      gap: 8,
    },
    title: { color: c.text, fontSize: 16, fontWeight: '700' },
    hint: { color: c.textMuted, fontSize: 12, marginBottom: 4 },
    label: { color: c.text, fontSize: 13, fontWeight: '600', marginTop: 6 },
    dateHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
    autoTxt: { color: c.accent, fontSize: 13, fontWeight: '700' },
    autoHint: { color: c.textMuted, fontSize: 12 },
    input: {
      color: c.text,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingVertical: 10,
    },
    save: { backgroundColor: c.accentStrong, borderRadius: 12, padding: 14, marginTop: 8 },
    saveTxt: { textAlign: 'center', fontWeight: '800', color: c.onAccent },
    delete: { padding: 10 },
    deleteTxt: { textAlign: 'center', color: c.bad, fontWeight: '700' },
  });
