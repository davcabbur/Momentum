import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { getProfile, setProfile } from '@/db/bodyweight-repo';
import { useTheme } from '@/ui/theme';
import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

const SEXES = [
  { key: 'male', label: 'Hombre' },
  { key: 'female', label: 'Mujer' },
];
const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentario' },
  { key: 'light', label: 'Ligero' },
  { key: 'moderate', label: 'Moderado' },
  { key: 'high', label: 'Alto' },
  { key: 'very_high', label: 'Muy alto' },
];
const STAGES = [
  { key: 'definicion', label: 'Déficit calórico' },
  { key: 'normocalorica', label: 'Normocalórica' },
  { key: 'volumen', label: 'Superávit calórico' },
];

const num = (s: string) => parseFloat(s.replace(',', '.'));

export function PerfilScreen() {
  const { c } = useTheme();
  const styles = useAjustesStyles();
  const [sex, setSex] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const p = await getProfile();
    if (p) {
      setSex(p.sex);
      setAge(p.age != null ? String(p.age) : '');
      setHeight(p.heightCm != null ? String(p.heightCm) : '');
      setActivity(p.activityLevel);
      setStage(p.stage);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function saveProfile() {
    if (!sex || !activity || !stage) return;
    await setProfile({ sex, age: Math.round(Number(age)) || 0, heightCm: Math.round(num(height)) || 0, stage, activityLevel: activity });
    setSaved(true);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Perfil" />
      <View style={styles.card}>
        <Text style={styles.lbl}>Sexo</Text>
        <View style={styles.row}>
          {SEXES.map((o) => (
            <Pressable key={o.key} style={[styles.pill, sex === o.key && styles.pillOn]} onPress={() => { setSex(o.key); setSaved(false); }}>
              <Text style={[styles.pillTxt, sex === o.key && styles.pillTxtOn]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Edad</Text>
            <TextInput value={age} onChangeText={(v) => { setAge(v); setSaved(false); }} keyboardType="number-pad" placeholder="años" placeholderTextColor={c.textMuted} style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Altura (cm)</Text>
            <TextInput value={height} onChangeText={(v) => { setHeight(v); setSaved(false); }} keyboardType="number-pad" placeholder="cm" placeholderTextColor={c.textMuted} style={styles.input} />
          </View>
        </View>
        <Text style={styles.lbl}>Actividad</Text>
        <View style={styles.wrap}>
          {ACTIVITIES.map((o) => (
            <Pressable key={o.key} style={[styles.chip, activity === o.key && styles.pillOn]} onPress={() => { setActivity(o.key); setSaved(false); }}>
              <Text style={[styles.chipTxt, activity === o.key && styles.pillTxtOn]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.lbl}>Etapa</Text>
        <View style={styles.wrap}>
          {STAGES.map((o) => (
            <Pressable key={o.key} style={[styles.chip, stage === o.key && styles.pillOn]} onPress={() => { setStage(o.key); setSaved(false); }}>
              <Text style={[styles.chipTxt, stage === o.key && styles.pillTxtOn]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.save} onPress={saveProfile}>
          <Text style={styles.saveTxt}>{saved ? 'Guardado ✓' : 'Guardar perfil'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
