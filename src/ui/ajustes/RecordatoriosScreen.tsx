import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { getSetting, setSetting } from '@/db/settings-repo';
import { cancelReminders, ensureNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { useTheme } from '@/ui/theme';
import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

export function RecordatoriosScreen() {
  const { c } = useTheme();
  const styles = useAjustesStyles();
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);

  const load = useCallback(async () => {
    setReminderOn((await getSetting('reminder_on')) === '1');
    const h = await getSetting('reminder_hour');
    setReminderHour(h ? Number(h) : 9);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleReminder(on: boolean) {
    if (on) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert('Permiso necesario', 'Activa las notificaciones del sistema para recibir recordatorios.');
        return;
      }
      await scheduleDailyReminder(reminderHour);
      await setSetting('reminder_on', '1');
      setReminderOn(true);
    } else {
      await cancelReminders();
      await setSetting('reminder_on', '0');
      setReminderOn(false);
    }
  }

  async function changeHour(delta: number) {
    const h = Math.max(5, Math.min(23, reminderHour + delta));
    setReminderHour(h);
    await setSetting('reminder_hour', String(h));
    if (reminderOn) await scheduleDailyReminder(h);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Recordatorios" />
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLbl}>Recordatorio diario</Text>
          <Switch value={reminderOn} onValueChange={toggleReminder} trackColor={{ true: c.accentStrong, false: c.cardBorder }} />
        </View>
        {reminderOn && (
          <View style={styles.hourRow}>
            <Text style={styles.note}>A las</Text>
            <Pressable style={styles.hourBtn} onPress={() => changeHour(-1)}>
              <Text style={styles.hourBtnTxt}>−</Text>
            </Pressable>
            <Text style={styles.hourVal}>{String(reminderHour).padStart(2, '0')}:00</Text>
            <Pressable style={styles.hourBtn} onPress={() => changeHour(1)}>
              <Text style={styles.hourBtnTxt}>+</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.note}>Un aviso al día para pesarte y registrar tu progreso. Quítalo cuando quieras.</Text>
      </View>
    </ScrollView>
  );
}
