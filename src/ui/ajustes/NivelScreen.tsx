import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useFocusEffect } from 'expo-router';

import { getProfile, setLevel } from '@/db/bodyweight-repo';
import { reapplyLevelToRoutine } from '@/db/routine-repo';
import { type Level } from '@/training/levels';
import { useAjustesStyles, SettingHeader } from '@/ui/ajustes/ui';

const LEVELS = ['principiante', 'intermedio', 'avanzado'];

export function NivelScreen() {
  const styles = useAjustesStyles();
  const [level, setLvl] = useState('intermedio');

  const load = useCallback(async () => {
    const p = await getProfile();
    if (p?.level) setLvl(p.level);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function pickLevel(l: string) {
    setLvl(l);
    await setLevel(l);
  }

  function confirmReapply() {
    Alert.alert(
      'Recalcular tu rutina',
      `Pondré las series/reps de todos tus ejercicios al esquema de nivel ${level}. Sobreescribe los ajustes manuales que hayas hecho. ¿Seguir?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Recalcular', onPress: async () => { await reapplyLevelToRoutine(level as Level); Alert.alert('Listo', 'Tu rutina se ha ajustado a tu nivel.'); } },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Nivel de entreno" />
      <View style={styles.card}>
        <View style={styles.row}>
          {LEVELS.map((l) => (
            <Pressable key={l} style={[styles.pill, level === l && styles.pillOn]} onPress={() => pickLevel(l)}>
              <Text style={[styles.pillTxt, level === l && styles.pillTxtOn]}>{l[0].toUpperCase() + l.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>Tu nivel ajusta el RIR objetivo y las series/reps de los ejercicios nuevos.</Text>
        <Pressable style={styles.secondary} onPress={confirmReapply}>
          <Text style={styles.secondaryTxt}>Recalcular mi rutina a este nivel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
