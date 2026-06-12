import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { maskDmy, parseDmy } from '@/bodyweight/format';
import { Brand } from '@/constants/theme';

function dmyFromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface Props {
  value: string; // DD/MM/AAAA
  onChange: (v: string) => void;
}

/** Campo de fecha DD/MM/AAAA: escribe a mano (con las `/` automáticas) o abre el calendario. */
export function DateField({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const iso = parseDmy(value);
  const pickerDate = iso ? new Date(iso + 'T00:00:00') : new Date();

  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(maskDmy(t))}
        keyboardType="number-pad"
        placeholder="DD/MM/AAAA"
        placeholderTextColor={Brand.textMuted}
        maxLength={10}
        style={styles.input}
      />
      <Pressable style={styles.iconBtn} onPress={() => setShow(true)}>
        <Text style={styles.icon}>📅</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          onChange={(_event, d) => {
            setShow(false);
            if (d) onChange(dmyFromDate(d));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  input: {
    flex: 1,
    color: Brand.text,
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: Brand.card,
    borderColor: Brand.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Brand.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
});
