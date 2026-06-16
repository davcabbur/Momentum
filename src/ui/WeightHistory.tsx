import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatKg } from '@/bodyweight/format';
import { Brand } from '@/constants/theme';
import { deleteWeights, listWeights } from '@/db/bodyweight-repo';
import { AddWeightSheet } from '@/ui/AddWeightSheet';

type Entry = { date: string; weightKg: number };

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Historial de pesajes: ver, editar y borrar (en lote). Vive en Progreso. */
export function WeightHistory() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ date: string; kg: number } | null>(null);

  const load = useCallback(async () => {
    const ws = await listWeights();
    ws.sort((a, b) => b.date.localeCompare(a.date));
    setEntries(ws);
    setSelected(new Set());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (entries.length === 0) return null;

  const allSelected = selected.size === entries.length;

  function toggle(date: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <View>
      <Text style={styles.title}>Historial de peso</Text>
      <View style={styles.card}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.date)))}>
            <Text style={styles.selectAll}>{allSelected ? '✕ Quitar selección' : '☑ Seleccionar todo'}</Text>
          </Pressable>
          {selected.size > 0 && (
            <Pressable
              style={styles.delBtn}
              onPress={async () => {
                await deleteWeights([...selected]);
                load();
              }}>
              <Text style={styles.delBtnTxt}>🗑 Borrar ({selected.size})</Text>
            </Pressable>
          )}
        </View>
        {entries.map((p, i) => {
          const isSel = selected.has(p.date);
          return (
            <View key={p.date} style={[styles.row, i < entries.length - 1 && styles.rowBorder]}>
              <Pressable style={styles.checkHit} onPress={() => toggle(p.date)}>
                <View style={[styles.checkbox, isSel && styles.checkboxOn]}>{isSel && <Text style={styles.checkMark}>✓</Text>}</View>
              </Pressable>
              <Text style={styles.date}>{shortDate(p.date)}</Text>
              <Text style={styles.kg}>{formatKg(p.weightKg)}</Text>
              <Pressable onPress={() => setEditing({ date: p.date, kg: p.weightKg })}>
                <Text style={styles.edit}>editar</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <AddWeightSheet
        visible={editing !== null}
        date={editing?.date ?? ''}
        initialKg={editing?.kg ?? 75}
        isExisting
        onClose={() => {
          setEditing(null);
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: Brand.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 4, marginBottom: 6 },
  card: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 12 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: Brand.cardBorder },
  selectAll: { color: Brand.accent, fontSize: 12, fontWeight: '600' },
  delBtn: { backgroundColor: '#3b1f22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  delBtnTxt: { color: '#f87171', fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Brand.cardBorder },
  checkHit: { padding: 2 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: Brand.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: Brand.accentStrong, borderColor: Brand.accentStrong },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '900' },
  date: { color: Brand.textMuted, fontSize: 13, width: 48 },
  kg: { color: Brand.text, fontSize: 15, fontWeight: '700', flex: 1 },
  edit: { color: Brand.accent, fontSize: 12 },
});
