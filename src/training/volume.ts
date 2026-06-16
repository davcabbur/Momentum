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

/**
 * Músculos secundarios por ejercicio compuesto (cuentan a medias para el volumen).
 * De la metodología: los empujes implican hombro/tríceps, los tirones bíceps, etc.
 */
const SECONDARY: Record<string, string[]> = {
  'Press inclinado': ['hombro', 'triceps'],
  'Press banca': ['hombro', 'triceps'],
  'Press plano mancuerna': ['hombro', 'triceps'],
  'Press declinado': ['hombro', 'triceps'],
  Fondos: ['hombro', 'triceps'],
  'Press militar': ['triceps'],
  'Press militar con barra': ['triceps'],
  'Press hombro en máquina': ['triceps'],
  'Jalón al pecho': ['biceps'],
  Dominadas: ['biceps'],
  'Remo mancuerna': ['biceps'],
  'Remo barra': ['biceps'],
  'Remo Gironda': ['biceps'],
  Sentadilla: ['gluteo'],
  'Hack squat': ['gluteo'],
  Prensa: ['gluteo'],
  Zancadas: ['gluteo'],
  'Sentadilla búlgara': ['gluteo'],
  'Peso muerto rumano': ['gluteo'],
  'Hip thrust': ['pierna'],
};

const SECONDARY_FACTOR = 0.5;

export function secondaryMuscles(exerciseName: string): string[] {
  return SECONDARY[exerciseName] ?? [];
}

export interface VolumeItem {
  name: string;
  muscleGroup: string;
  targetSets: number;
}

/**
 * Series semanales por músculo: cuenta entero al músculo principal y a medias a
 * los secundarios de los compuestos. Redondeado a 0,5.
 */
export function weeklyMuscleVolume(items: VolumeItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    out[it.muscleGroup] = (out[it.muscleGroup] ?? 0) + it.targetSets;
    for (const m of secondaryMuscles(it.name)) {
      out[m] = (out[m] ?? 0) + it.targetSets * SECONDARY_FACTOR;
    }
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 2) / 2;
  return out;
}

/** Estado del volumen semanal planificado de un músculo (para la rutina). */
export function muscleVolumeStatus(muscleGroup: string, weeklySets: number): VolumeWarning {
  const { min, max } = weeklyVolumeRange(muscleGroup);
  const n = weeklySets % 1 === 0 ? `${weeklySets}` : weeklySets.toFixed(1).replace('.', ',');
  if (weeklySets > max) {
    return {
      level: 'warn',
      text: `${n} series/sem es bastante para este músculo (lo habitual es ${min}–${max}). Vigila la recuperación; más no siempre es mejor.`,
    };
  }
  if (weeklySets > 0 && weeklySets < min) {
    return {
      level: 'info',
      text: `${n} series/sem; para crecer suele ir bien ${min}–${max}. Si es a propósito (recuperar, mantener), perfecto.`,
    };
  }
  return { level: 'ok', text: `${n} series/sem · en rango (${min}–${max}).` };
}
