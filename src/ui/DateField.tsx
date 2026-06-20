import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { maskDmy, parseDmy } from '@/bodyweight/format';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

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
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
        placeholderTextColor={c.textMuted}
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

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    input: {
      flex: 1,
      color: c.text,
      fontSize: 20,
      fontWeight: '700',
      backgroundColor: c.card,
      borderColor: c.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: { fontSize: 20 },
  });
