import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * expo-notifications se carga de forma diferida (import dinámico) y solo cuando
 * el usuario usa los recordatorios. Así el arranque de la app no carga el módulo
 * (que en Expo Go avisa de que el push remoto no está disponible). Las
 * notificaciones LOCALES (nuestro recordatorio diario) sí funcionan.
 */
let handlerSet = false;

async function notifs(): Promise<typeof NotificationsType> {
  const N = (await import('expo-notifications')) as typeof NotificationsType;
  if (!handlerSet) {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerSet = true;
  }
  return N;
}

async function ensureAndroidChannel(N: typeof NotificationsType): Promise<void> {
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('recordatorios', {
      name: 'Recordatorios',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
}

/** Pide permiso de notificaciones. Devuelve true si está concedido. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const N = await notifs();
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const req = await N.requestPermissionsAsync();
  return req.granted;
}

/** Programa (o reprograma) el recordatorio diario a la hora dada. */
export async function scheduleDailyReminder(hour: number): Promise<void> {
  const N = await notifs();
  await ensureAndroidChannel(N);
  await N.cancelAllScheduledNotificationsAsync();
  await N.scheduleNotificationAsync({
    content: {
      title: 'Momentum',
      body: 'Recuerda pesarte y registrar tu día. Pequeños pasos, gran progreso. 💪',
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: 'recordatorios',
    },
  });
}

/** Cancela todos los recordatorios programados. */
export async function cancelReminders(): Promise<void> {
  const N = await notifs();
  await N.cancelAllScheduledNotificationsAsync();
}
