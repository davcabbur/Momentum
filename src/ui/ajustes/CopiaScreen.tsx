import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { exportData, importData } from '@/db/backup';
import { seedExercises } from '@/db/exercise-repo';
import { pickBackupJson, shareBackup } from '@/lib/backup-file';
import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

const today = () => new Date().toISOString().slice(0, 10);

export function CopiaScreen() {
  const styles = useAjustesStyles();

  async function exportBackup() {
    try {
      const json = await exportData();
      await shareBackup(json, `momentum-backup-${today()}.json`);
    } catch (e) {
      Alert.alert('No se pudo exportar', String((e as Error)?.message ?? e));
    }
  }

  function confirmImport() {
    Alert.alert(
      'Importar copia',
      'Esto REEMPLAZARÁ todos tus datos actuales (entrenos, peso, comidas, ajustes) por los de la copia. ¿Seguir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          style: 'destructive',
          onPress: async () => {
            try {
              const json = await pickBackupJson();
              if (!json) return;
              const { rows } = await importData(json);
              await seedExercises();
              Alert.alert('Copia restaurada', `Se han importado ${rows} registros. Si algo no se actualiza, reabre la app.`);
            } catch (e) {
              Alert.alert('No se pudo importar', String((e as Error)?.message ?? e));
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Copia de seguridad" />
      <View style={styles.card}>
        <Text style={styles.note}>Tus datos viven en este móvil y se copian a tu cuenta al sincronizar. Exporta además una copia local si quieres tener el control.</Text>
        <Pressable style={styles.save} onPress={exportBackup}>
          <Text style={styles.saveTxt}>Exportar copia</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={confirmImport}>
          <Text style={styles.secondaryTxt}>Importar copia</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
