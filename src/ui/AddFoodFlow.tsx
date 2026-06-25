import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addFoodEntry, listKnownFoods, type KnownFood } from '@/db/food-repo';
import { searchBasicFoods } from '@/nutrition/basic-foods';
import { portionMacros, type Per100 } from '@/nutrition/macros';
import { searchProducts } from '@/nutrition/openfoodfacts';
import { MacroRing } from '@/ui/MacroRing';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

function num(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0;
}
function numOrNull(s: string): number | null {
  return s.trim() === '' ? null : num(s);
}
function str(v: number | null | undefined): string {
  return v == null ? '' : String(v);
}

export interface InitialProduct {
  name: string;
  per100: Per100;
  barcode?: string | null;
}

interface Props {
  visible: boolean;
  date: string;
  initial?: InitialProduct | null; // p. ej. producto escaneado → va directo a la ración
  onClose: () => void;
  onAdded: () => void;
}

type Pick = { name: string; per100: Per100; grams?: number | null };

/** Pantalla completa para añadir alimento: búsqueda (historial + todos) y ración con anillo. */
export function AddFoodFlow({ visible, date, initial, onClose, onAdded }: Props) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<'search' | 'portion'>('search');
  const [query, setQuery] = useState('');
  const [known, setKnown] = useState<KnownFood[]>([]);
  const [offResults, setOffResults] = useState<Pick[]>([]);
  const [offLoading, setOffLoading] = useState(false);
  const [offDone, setOffDone] = useState(false);

  // Ración seleccionada (valores por 100 g editables).
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('100');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [sug, setSug] = useState('');
  const [fib, setFib] = useState('');
  const [sat, setSat] = useState('');
  const [barcode, setBarcode] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setOffResults([]);
    setOffDone(false);
    listKnownFoods().then(setKnown);
    if (initial) {
      fill({ name: initial.name, per100: initial.per100 });
      setBarcode(initial.barcode ?? null);
      setPhase('portion');
    } else {
      setPhase('search');
    }
  }, [visible, initial]);

  function fill(p: Pick) {
    setName(p.name);
    setKcal(str(p.per100.kcal));
    setProt(str(p.per100.protein));
    setCarb(str(p.per100.carbs));
    setFat(str(p.per100.fat));
    setSug(str(p.per100.sugars));
    setFib(str(p.per100.fiber));
    setSat(str(p.per100.satFat));
    setGrams(p.grams && p.grams > 0 ? String(p.grams) : '100');
    setShowValues(p.per100.kcal <= 0); // si no hay datos, abre los campos para rellenarlos
  }

  function selectPick(p: Pick) {
    setBarcode(null);
    fill(p);
    setPhase('portion');
  }

  function createManual() {
    setBarcode(null);
    setName(query.trim());
    setKcal('');
    setProt('');
    setCarb('');
    setFat('');
    setSug('');
    setFib('');
    setSat('');
    setGrams('100');
    setShowValues(true);
    setPhase('portion');
  }

  async function searchAll() {
    setOffLoading(true);
    setOffDone(true);
    const res = await searchProducts(query.trim());
    setOffResults(res.map((o) => ({ name: o.name, per100: o.per100, grams: null })));
    setOffLoading(false);
  }

  const q = query.trim().toLowerCase();
  const histMatches: Pick[] =
    q.length === 0
      ? known.slice(0, 12)
      : [
          ...known.filter((k) => k.name.toLowerCase().includes(q)),
          ...searchBasicFoods(query).filter((b) => !known.some((k) => k.name.toLowerCase() === b.name.toLowerCase())).map((b) => ({ name: b.name, per100: b.per100, grams: null })),
        ].slice(0, 12);

  const g = num(grams);
  const per100: Per100 = {
    kcal: num(kcal),
    protein: num(prot),
    carbs: num(carb),
    fat: num(fat),
    sugars: numOrNull(sug),
    fiber: numOrNull(fib),
    satFat: numOrNull(sat),
  };
  const portion = portionMacros(per100, g);
  const canSave = name.trim().length > 0 && g > 0 && num(kcal) > 0;

  async function add() {
    if (!canSave) return;
    try {
      await addFoodEntry({
        date,
        name: name.trim(),
        grams: g,
        kcal: portion.kcal,
        protein: portion.protein,
        carbs: portion.carbs,
        fat: portion.fat,
        sugars: portion.sugars,
        fiber: portion.fiber,
        satFat: portion.satFat,
        barcode,
      });
      onAdded();
    } catch (e) {
      // No fallar en silencio: si el guardado peta, el usuario debe enterarse.
      Alert.alert('No se pudo guardar', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        {phase === 'search' ? (
          <>
            <View style={styles.topRow}>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={styles.cancel}>Cancelar</Text>
              </Pressable>
              <Text style={styles.topTitle}>Añadir alimento</Text>
              <View style={{ width: 64 }} />
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={c.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                autoFocus
                placeholder="Busca un alimento"
                placeholderTextColor={c.textMuted}
                style={styles.searchInput}
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
              <Text style={styles.section}>{q.length === 0 ? 'Recientes' : 'En tu historial'}</Text>
              {histMatches.length === 0 && <Text style={styles.empty}>{q.length === 0 ? 'Aún no has registrado alimentos.' : 'Nada en tu historial.'}</Text>}
              {histMatches.map((p) => (
                <Pressable key={'h:' + p.name} style={styles.row} onPress={() => selectPick(p)}>
                  <Text style={styles.rowName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.rowKcal}>{p.per100.kcal} kcal/100 g</Text>
                </Pressable>
              ))}

              {q.length >= 2 && (
                <>
                  {!offDone ? (
                    <Pressable style={styles.searchAll} onPress={searchAll}>
                      <Ionicons name="globe-outline" size={16} color={c.accent} />
                      <Text style={styles.searchAllTxt}>Buscar todos los alimentos: “{query.trim()}”</Text>
                    </Pressable>
                  ) : (
                    <>
                      <Text style={styles.section}>Todos los alimentos</Text>
                      {offLoading && <ActivityIndicator color={c.accent} style={{ marginVertical: 10 }} />}
                      {!offLoading && offResults.length === 0 && <Text style={styles.empty}>Sin resultados en Open Food Facts.</Text>}
                      {offResults.map((p, i) => (
                        <Pressable key={'o:' + i + p.name} style={styles.row} onPress={() => selectPick(p)}>
                          <Text style={styles.rowName} numberOfLines={1}>{p.name}</Text>
                          <Text style={styles.rowKcal}>{p.per100.kcal} kcal/100 g</Text>
                        </Pressable>
                      ))}
                    </>
                  )}
                  <Pressable style={styles.manual} onPress={createManual}>
                    <Ionicons name="create-outline" size={16} color={c.textMuted} />
                    <Text style={styles.manualTxt}>Crear “{query.trim()}” a mano</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.topRow}>
              <Pressable onPress={() => (initial ? onClose() : setPhase('search'))} hitSlop={10}>
                <Text style={styles.cancel}>‹ {initial ? 'Cancelar' : 'Volver'}</Text>
              </Pressable>
              <Text style={styles.topTitle} numberOfLines={1}>{name || 'Alimento'}</Text>
              <View style={{ width: 64 }} />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 14 }}>
              <View style={styles.dash}>
                <MacroRing kcal={portion.kcal} protein={portion.protein} carbs={portion.carbs} fat={portion.fat} />
              </View>

              <View>
                <Text style={styles.lbl}>Ración (gramos)</Text>
                <TextInput value={grams} onChangeText={setGrams} keyboardType="decimal-pad" placeholder="g" placeholderTextColor={c.textMuted} style={styles.input} />
              </View>

              <Pressable style={styles.valuesHead} onPress={() => setShowValues((v) => !v)}>
                <Text style={styles.valuesHeadTxt}>Valores por 100 g</Text>
                <Ionicons name={showValues ? 'chevron-up' : 'chevron-down'} size={16} color={c.accent} />
              </Pressable>
              {showValues && (
                <View style={styles.grid}>
                  <Field label="Kcal" value={kcal} onChange={setKcal} />
                  <Field label="Proteína" value={prot} onChange={setProt} />
                  <Field label="Carbos" value={carb} onChange={setCarb} />
                  <Field label="Grasa" value={fat} onChange={setFat} />
                  <Field label="Azúcares" value={sug} onChange={setSug} />
                  <Field label="Fibra" value={fib} onChange={setFib} />
                  <Field label="Saturadas" value={sat} onChange={setSat} />
                </View>
              )}

              <Pressable style={[styles.add, !canSave && styles.addOff]} disabled={!canSave} onPress={add}>
                <Text style={styles.addTxt}>Añadir ración ({g > 0 ? g : 0} g)</Text>
              </Pressable>
            </ScrollView>
          </>
        )}
      </View>
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
    screen: { flex: 1, backgroundColor: c.surface },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8 },
    cancel: { color: c.accent, fontWeight: '700', fontSize: 15, width: 64 },
    topTitle: { color: c.text, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, marginHorizontal: 14, marginBottom: 6 },
    searchInput: { flex: 1, color: c.text, fontSize: 16 },
    section: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginTop: 14, marginBottom: 6, paddingHorizontal: 16 },
    empty: { color: c.textMuted, fontSize: 13, fontStyle: 'italic', paddingHorizontal: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: c.cardBorder, borderBottomWidth: 1 },
    rowName: { color: c.text, fontSize: 15, fontWeight: '600', flex: 1, marginRight: 10 },
    rowKcal: { color: c.textMuted, fontSize: 12 },
    searchAll: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginTop: 14, padding: 14, borderColor: c.accentStrong, borderWidth: 1, borderRadius: 12 },
    searchAllTxt: { color: c.accent, fontSize: 14, fontWeight: '700', flex: 1 },
    manual: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 12 },
    manualTxt: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
    dash: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16 },
    lbl: { color: c.textMuted, fontSize: 12, marginBottom: 4 },
    input: { color: c.text, fontSize: 18, fontWeight: '700', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
    valuesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    valuesHeadTxt: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    field: { flexBasis: '47%', flexGrow: 1 },
    fieldLbl: { color: c.textMuted, fontSize: 12 },
    fieldInput: { color: c.text, fontSize: 16, fontWeight: '700', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginTop: 4 },
    add: { backgroundColor: c.accentStrong, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
    addOff: { opacity: 0.5 },
    addTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
  });
