import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';
import { addFoodEntry, listKnownFoods, type KnownFood } from '@/db/food-repo';
import { portionMacros, type Macros } from '@/nutrition/macros';
import { searchProducts } from '@/nutrition/openfoodfacts';

function num(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0;
}

export interface FoodPrefill {
  name: string;
  per100: Macros;
  barcode?: string;
}

interface Props {
  visible: boolean;
  date: string;
  prefill?: FoodPrefill | null;
  onClose: () => void;
}

/** Alta manual de alimento por valores por 100 g (como las etiquetas). */
export function AddFoodSheet({ visible, date, prefill, onClose }: Props) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('100');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [barcode, setBarcode] = useState<string | null>(null);
  const [known, setKnown] = useState<KnownFood[]>([]);
  const [offResults, setOffResults] = useState<{ name: string; per100: Macros }[]>([]);
  const [searching, setSearching] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false); // mostrar historial al enfocar la barra vacía

  function reset() {
    setName('');
    setGrams('100');
    setKcal('');
    setProt('');
    setCarb('');
    setFat('');
    setBarcode(null);
    setHistoryOpen(false);
  }

  // Al abrir, prerellenar desde el escáner (o limpiar para alta manual).
  useEffect(() => {
    if (!visible) return;
    if (prefill) {
      setName(prefill.name);
      setGrams('100');
      setKcal(String(prefill.per100.kcal));
      setProt(String(prefill.per100.protein));
      setCarb(String(prefill.per100.carbs));
      setFat(String(prefill.per100.fat));
      setBarcode(prefill.barcode ?? null);
    } else {
      reset();
    }
  }, [visible, prefill]);

  useEffect(() => {
    if (visible) listKnownFoods().then(setKnown);
  }, [visible]);

  // Búsqueda por nombre en Open Food Facts (con debounce).
  useEffect(() => {
    const term = name.trim();
    if (!visible || term.length < 3) {
      setOffResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const id = setTimeout(async () => {
      const res = await searchProducts(term);
      if (active) {
        setOffResults(res);
        setSearching(false);
      }
    }, 450);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [name, visible]);

  const g = num(grams);
  const per100 = { kcal: num(kcal), protein: num(prot), carbs: num(carb), fat: num(fat) };
  const preview = portionMacros(per100, g);
  const canSave = name.trim().length > 0 && g > 0 && num(kcal) > 0;

  const q = name.trim().toLowerCase();
  type Sugg = { name: string; per100: Macros; grams: number | null; src: 'hist' | 'mine' | 'off' };
  let suggestions: Sugg[];
  if (q.length === 0) {
    // Historial: alimentos ya usados (recientes primero), al pulsar la barra de búsqueda.
    suggestions = historyOpen ? known.slice(0, 8).map((k) => ({ ...k, src: 'hist' as const })) : [];
  } else {
    const localMatches = known.filter((k) => k.name.toLowerCase().includes(q) && k.name.toLowerCase() !== q);
    const localNames = new Set(localMatches.map((k) => k.name.toLowerCase()));
    const offMatches = offResults.filter((o) => o.name.toLowerCase() !== q && !localNames.has(o.name.toLowerCase()));
    suggestions = [
      ...localMatches.map((k) => ({ ...k, src: 'mine' as const })),
      ...offMatches.map((o) => ({ name: o.name, per100: o.per100, grams: null, src: 'off' as const })),
    ].slice(0, 8);
  }

  function pick(s: { name: string; per100: Macros; grams?: number | null }) {
    setName(s.name);
    setKcal(String(s.per100.kcal));
    setProt(String(s.per100.protein));
    setCarb(String(s.per100.carbs));
    setFat(String(s.per100.fat));
    if (s.grams != null && s.grams > 0) setGrams(String(s.grams));
    setHistoryOpen(false);
  }

  async function save() {
    if (!canSave) return;
    await addFoodEntry({
      date,
      name: name.trim(),
      grams: g,
      kcal: preview.kcal,
      protein: preview.protein,
      carbs: preview.carbs,
      fat: preview.fat,
      barcode,
    });
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Añadir alimento</Text>

            <Text style={styles.lbl}>Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setHistoryOpen(true)}
              placeholder="Busca o escribe un alimento"
              placeholderTextColor={c.textMuted}
              style={styles.input}
            />
            {(suggestions.length > 0 || searching) && (
              <View style={styles.suggBox}>
                {q.length === 0 && suggestions.length > 0 && <Text style={styles.suggHead}>Recientes</Text>}
                {suggestions.map((s) => (
                  <Pressable key={s.src + ':' + s.name} style={styles.sugg} onPress={() => pick(s)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggName}>{s.name}</Text>
                      <Text style={styles.suggSrc}>{s.src === 'off' ? 'Open Food Facts' : s.src === 'hist' ? 'Reciente' : 'Ya registrado'}</Text>
                    </View>
                    <Text style={styles.suggMacro}>{s.per100.kcal} kcal/100 g</Text>
                  </Pressable>
                ))}
                {searching && <Text style={styles.suggSearching}>Buscando en Open Food Facts…</Text>}
              </View>
            )}

            <Text style={styles.lbl}>Ración (gramos)</Text>
            <TextInput value={grams} onChangeText={setGrams} keyboardType="decimal-pad" placeholder="g" placeholderTextColor={c.textMuted} style={styles.input} />

            <Text style={styles.section}>Por 100 g (de la etiqueta)</Text>
            <View style={styles.grid}>
              <Field label="Kcal" value={kcal} onChange={setKcal} />
              <Field label="Proteína" value={prot} onChange={setProt} />
              <Field label="Carbos" value={carb} onChange={setCarb} />
              <Field label="Grasa" value={fat} onChange={setFat} />
            </View>

            {/* Macros ajustados a la ración (en vivo según los gramos). */}
            <View style={styles.portion}>
              <Text style={styles.portionLbl}>Tu ración · {g > 0 ? g : 0} g</Text>
              <Text style={styles.portionKcal}>{preview.kcal} kcal</Text>
              <View style={styles.portionRow}>
                <Text style={styles.portionMacro}>P {preview.protein} g</Text>
                <Text style={styles.portionMacro}>C {preview.carbs} g</Text>
                <Text style={styles.portionMacro}>G {preview.fat} g</Text>
              </View>
            </View>

            <Pressable style={[styles.save, !canSave && styles.saveOff]} disabled={!canSave} onPress={save}>
              <Text style={styles.saveTxt}>Añadir ración ({g > 0 ? g : 0} g)</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLbl}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={c.textMuted} style={styles.fieldInput} />
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    title: { color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
    lbl: { color: c.textMuted, fontSize: 12, marginTop: 8 },
    section: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 14 },
    input: { color: c.text, fontSize: 18, fontWeight: '700', backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
    suggBox: { backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, marginTop: 6, overflow: 'hidden' },
    suggHead: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 2 },
    sugg: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.cardBorder },
    suggName: { color: c.text, fontSize: 14, fontWeight: '600' },
    suggSrc: { color: c.textMuted, fontSize: 10, marginTop: 1 },
    suggMacro: { color: c.textMuted, fontSize: 12, marginLeft: 8 },
    suggSearching: { color: c.textMuted, fontSize: 12, fontStyle: 'italic', padding: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
    field: { flexBasis: '47%', flexGrow: 1 },
    fieldLbl: { color: c.textMuted, fontSize: 12 },
    fieldInput: { color: c.text, fontSize: 16, fontWeight: '700', backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginTop: 4 },
    portion: { backgroundColor: c.surface, borderColor: c.accentStrong, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14, alignItems: 'center', gap: 4 },
    portionLbl: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    portionKcal: { color: c.good, fontSize: 24, fontWeight: '800' },
    portionRow: { flexDirection: 'row', gap: 16 },
    portionMacro: { color: c.text, fontSize: 13, fontWeight: '700' },
    save: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    saveOff: { opacity: 0.4 },
    saveTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
  });
