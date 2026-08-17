import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

/** Muestra el peso con coma, que es el separador decimal de aquí y el de la app. */
const aTexto = (kg: number): string => kg.toFixed(1).replace('.', ',');

/** Lee lo escrito acepte coma o punto: el teclado del iPhone en español da coma. */
const aNumero = (texto: string): number => parseFloat(texto.replace(',', '.'));

export function AddWeightSheet({ visible, date, initialKg, isExisting, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(() => aTexto(initialKg));

  useEffect(() => {
    if (visible) setValue(aTexto(initialKg));
  }, [visible, initialKg]);

  /** Deja escribir solo cifras y UN separador decimal, con una decimal como mucho. */
  function onChange(texto: string) {
    const limpio = texto
      .replace(/[^0-9.,]/g, '')
      .replace(/[.,]/g, ',')
      .replace(/,(?=.*,)/g, ''); // se queda solo la primera coma
    const [entera, decimal] = limpio.split(',');
    setValue(decimal === undefined ? entera : `${entera},${decimal.slice(0, 1)}`);
  }

  function step(delta: number) {
    const current = aNumero(value);
    // Nunca por debajo de 0,1: un peso de 0 o negativo no significa nada.
    const next = Math.max(0.1, (Number.isNaN(current) ? initialKg : current) + delta);
    setValue(aTexto(next));
  }

  async function save() {
    const kg = aNumero(value);
    if (Number.isNaN(kg) || kg <= 0) {
      // Antes se cerraba sin guardar y sin decir nada: parecía que el peso se había
      // registrado y no era así.
      Alert.alert('Peso no válido', 'Escribe tu peso en kilos, por ejemplo 82,4.');
      return;
    }
    await upsertWeight(date, kg);
    onClose();
  }

  async function remove() {
    await deleteWeight(date);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={() => {}}>
          <Text style={styles.title}>Peso de {prettyDate(date)} (kg)</Text>
          <View style={styles.row}>
            <Pressable style={styles.stepBtn} onPress={() => step(-0.1)}>
              <Text style={styles.stepTxt}>−</Text>
            </Pressable>
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              selectTextOnFocus
              // En web `selectTextOnFocus` no hace nada, así que sin esto al tocar el campo
              // el cursor cae donde sea y acabas añadiendo cifras al peso en vez de
              // reemplazarlo.
              onFocus={(e) => (e.nativeEvent.target as unknown as HTMLInputElement)?.select?.()}
              returnKeyType="done"
              onSubmitEditing={save}
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
      // Sin `minWidth: 0` el "+" desaparecía en web: react-native-web pinta un <input>,
      // que trae una anchura intrínseca de unos 20 caracteres, y con `min-width: auto`
      // flexbox no lo deja encogerse por debajo de eso. El campo desbordaba la fila y
      // empujaba el botón de la derecha fuera de la pantalla.
      minWidth: 0,
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
