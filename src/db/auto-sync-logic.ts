/**
 * Decide si toca subir una copia a la nube sin que el usuario haga nada.
 *
 * Función pura: no toca la BD ni la red, solo decide. Así se puede probar de verdad, que
 * es importante porque una decisión mal tomada aquí sobrescribe los datos de la nube.
 *
 * Dos reglas mandan sobre todo lo demás:
 *
 * 1. Solo se SUBE, nunca se baja. Bajar reemplaza la base de datos local, y hacerlo sin
 *    preguntar podría borrar el entreno que acabas de registrar. Elegir entre local y
 *    nube es cosa del reconcile al iniciar sesión, que sí sabe preguntar.
 * 2. Solo si los datos locales son de esta cuenta (`dataOwner === userId`). Si no
 *    constan como suyos —instalación nueva y vacía, o datos de otra cuenta— subirlos
 *    machacaría la copia buena de alguien con una vacía o ajena. En la duda, no se sube:
 *    ya lo resolverá el reconcile.
 */

export interface AutoSyncInput {
  /** Hay sesión iniciada. */
  hasSession: boolean;
  /** El reconcile de inicio de sesión está en marcha: no meterse en medio. */
  reconciling: boolean;
  /** Id de la cuenta a la que pertenecen los datos locales (null si no consta). */
  dataOwner: string | null;
  /** Id del usuario con la sesión abierta. */
  userId: string | null;
  /** Marca ISO de la última sincronización en este dispositivo. */
  lastSyncAt: string | null;
  /** Ahora, en milisegundos. */
  nowMs: number;
  /** Horas mínimas desde la última copia para volver a subir. */
  minHours?: number;
}

const DEFAULT_MIN_HOURS = 24;

export function shouldAutoSync({
  hasSession,
  reconciling,
  dataOwner,
  userId,
  lastSyncAt,
  nowMs,
  minHours = DEFAULT_MIN_HOURS,
}: AutoSyncInput): boolean {
  if (!hasSession || !userId) return false;
  if (reconciling) return false;

  // Los datos locales tienen que constar como de esta cuenta. Sin eso, no se sube.
  if (dataOwner !== userId) return false;

  // Consta que son suyos pero no hay marca de sincronización: subir es lo seguro, porque
  // significa que la nube podría no tener nada.
  if (!lastSyncAt) return true;

  const last = Date.parse(lastSyncAt);
  // Fecha ilegible: se trata como si no hubiera, en vez de dejar de sincronizar para
  // siempre por un valor corrupto.
  if (Number.isNaN(last)) return true;

  // Marca en el futuro (reloj cambiado, copia restaurada de otro móvil): no se sube ahora;
  // se esperará a que el tiempo la alcance, en vez de subir en cada arranque.
  if (last > nowMs) return false;

  return nowMs - last >= minHours * 60 * 60 * 1000;
}
