/**
 * Versión web de `notifications.ts` (Metro elige este archivo al compilar para web).
 *
 * En el navegador no se pueden programar notificaciones locales para más tarde: la
 * API que lo permitiría (Notification Triggers) nunca llegó a los navegadores, y las
 * notificaciones push de una PWA en iOS necesitan un servidor de push, que Momentum
 * no tiene. Un `setTimeout` no vale: iOS congela los temporizadores al salir de la
 * app, así que el aviso llegaría tarde — peor que no llegar.
 *
 * Así que aquí todo no hace nada y `ensureNotificationPermission` devuelve false.
 * La cuenta atrás del descanso sigue funcionando dentro de la app (es visual); lo
 * único que se pierde es el aviso con la app cerrada. Para eso está la app de Android.
 */

/** En web no hay recordatorios programables: siempre false, sin pedir nada al usuario. */
export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleDailyReminder(_hour: number): Promise<void> {}

export async function cancelReminders(): Promise<void> {}

export async function scheduleRestDoneNotification(_seconds: number): Promise<string | null> {
  return null;
}

export async function cancelScheduledNotification(_id: string): Promise<void> {}
