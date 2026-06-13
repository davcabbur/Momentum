/** 1RM estimado (fórmula de Epley). Con 1 rep = el propio peso. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/** Mejor 1RM estimado de un conjunto de series (para PRs). */
export function bestOneRepMax(sets: { weightKg: number; reps: number }[]): number {
  return sets.reduce((best, s) => Math.max(best, estimateOneRepMax(s.weightKg, s.reps)), 0);
}

export interface RepRange {
  sets: number;
  repMin: number;
  repMax: number;
}

/** Incremento de peso sugerido según el peso actual (saltos pequeños en pesos bajos). */
function increment(weightKg: number): number {
  return weightKg < 20 ? 1 : 2.5;
}

export interface ProgressionHint {
  ready: boolean;
  suggestedWeightKg: number | null;
  text: string;
}

/**
 * Doble progresión: si en la última sesión TODAS las series de trabajo llegaron
 * al tope del rango de reps, toca subir el peso (y volver al extremo bajo del rango).
 */
export function progressionHint(lastSets: { weightKg: number; reps: number }[], scheme: RepRange): ProgressionHint {
  if (lastSets.length === 0) {
    return { ready: false, suggestedWeightKg: null, text: 'Registra una sesión para ver tu progresión.' };
  }
  const allHitTop = lastSets.length >= scheme.sets && lastSets.every((s) => s.reps >= scheme.repMax);
  if (allHitTop) {
    const maxW = Math.max(...lastSets.map((s) => s.weightKg));
    const suggested = Math.round((maxW + increment(maxW)) * 10) / 10;
    const w = String(suggested).replace('.', ',');
    return {
      ready: true,
      suggestedWeightKg: suggested,
      text: `¡A subir peso! Llegaste a ${scheme.repMax} reps en todas las series. Prueba ${w} kg y vuelve a ${scheme.repMin} reps.`,
    };
  }
  return {
    ready: false,
    suggestedWeightKg: null,
    text: `Busca llegar a ${scheme.repMax} reps en todas las series (con buena técnica) antes de subir peso.`,
  };
}
