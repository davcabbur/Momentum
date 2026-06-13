/**
 * Avisos de volumen. Filosofía de producto: orientar, no presionar ni generar
 * ansiedad. Los textos son educativos y siempre en positivo.
 *
 * Tabla orientativa (metodología): músculos grandes (pecho, espalda, pierna)
 * 10–20 series/semana; pequeños 8–15. Por ejercicio y sesión, pasado cierto
 * punto las series extra son "basura" (fatigan sin dar más músculo).
 */

export type VolumeLevel = 'ok' | 'info' | 'warn';

export interface VolumeWarning {
  level: VolumeLevel;
  text: string;
}

const OK: VolumeWarning = { level: 'ok', text: '' };

/** Tope razonable de series de trabajo por ejercicio en una sesión. */
export function exerciseSetCap(targetSets: number): number {
  return Math.max(targetSets + 2, 5);
}

/**
 * Aviso al acumular series en un mismo ejercicio dentro de la sesión.
 * No cuenta calentamientos (se pasan ya filtradas las series de trabajo).
 */
export function exerciseSetWarning(workSets: number, targetSets: number): VolumeWarning {
  const cap = exerciseSetCap(targetSets);
  if (workSets > cap) {
    return {
      level: 'warn',
      text: `Llevas ${workSets} series en este ejercicio. A partir de aquí suelen ser "series basura": fatigan sin dar más músculo. Con ${targetSets}–${cap} bien hechas basta. 💡`,
    };
  }
  return OK;
}

const LARGE_MUSCLES = new Set(['pecho', 'espalda', 'pierna']);

/** Rango orientativo de series por semana según el tamaño del músculo. */
export function weeklyVolumeRange(muscleGroup: string): { min: number; max: number } {
  return LARGE_MUSCLES.has(muscleGroup) ? { min: 10, max: 20 } : { min: 8, max: 15 };
}

/** Estado del volumen semanal planificado de un músculo (para la rutina). */
export function muscleVolumeStatus(muscleGroup: string, weeklySets: number): VolumeWarning {
  const { min, max } = weeklyVolumeRange(muscleGroup);
  if (weeklySets > max) {
    return {
      level: 'warn',
      text: `${weeklySets} series/sem es bastante para este músculo (lo habitual es ${min}–${max}). Vigila la recuperación; más no siempre es mejor.`,
    };
  }
  if (weeklySets > 0 && weeklySets < min) {
    return {
      level: 'info',
      text: `${weeklySets} series/sem; para crecer suele ir bien ${min}–${max}. Si es a propósito (recuperar, mantener), perfecto.`,
    };
  }
  return { level: 'ok', text: `${weeklySets} series/sem · en rango (${min}–${max}).` };
}
