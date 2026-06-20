import { type RepRange } from './progression';

export type SetKind = 'top' | 'backoff' | 'normal';

export interface SetRecommendation {
  setType: SetKind;
  weightKg: number | null; // null si no hay datos para sugerir (primera vez)
  repMin: number;
  repMax: number;
}

/** El back-off se hace ~10% por debajo del top set (más reps, menos carga). */
const BACKOFF_FACTOR = 0.9;

/** Redondea a placa realista: de 2,5 en 2,5 kg (1 en 1 con pesos bajos). */
function roundPlate(w: number): number {
  return w < 20 ? Math.round(w) : Math.round(w / 2.5) * 2.5;
}

/** Tipo de serie por defecto: en compuestos 1ª = top set, resto = back-off; aislamiento = normal. */
export function defaultSetKind(setNumber: number, isCompound: boolean): SetKind {
  if (!isCompound) return 'normal';
  return setNumber === 1 ? 'top' : 'backoff';
}

export interface RecommendInput {
  setNumber: number;
  isCompound: boolean;
  scheme: RepRange;
  /** Peso objetivo del top set esta sesión (de la doble progresión o la última vez). */
  topSetWeightKg: number | null;
  /** Lo que se hizo la última vez en esta misma serie (respaldo si no hay top set). */
  lastSameWeightKg: number | null;
  /** Dominadas/fondos: el peso es corporal, no se reduce el back-off. */
  bodyweightLoaded?: boolean;
}

/**
 * Recomienda tipo de serie, peso y rango de reps para una serie concreta, con carga
 * progresiva basada en sesiones anteriores. El top set va a la parte baja del rango
 * (más pesado) y el back-off a la alta (~10% menos de peso, más reps).
 */
export function recommendSet(input: RecommendInput): SetRecommendation {
  const { setNumber, isCompound, scheme, topSetWeightKg, lastSameWeightKg, bodyweightLoaded } = input;
  const kind = defaultSetKind(setNumber, isCompound);

  let repMin = scheme.repMin;
  let repMax = scheme.repMax;
  if (kind === 'top') {
    repMax = Math.min(scheme.repMax, scheme.repMin + 2);
  } else if (kind === 'backoff') {
    repMin = Math.max(scheme.repMin, scheme.repMax - 2);
  }

  let weightKg: number | null;
  if (kind === 'backoff' && topSetWeightKg != null && !bodyweightLoaded) {
    weightKg = roundPlate(topSetWeightKg * BACKOFF_FACTOR);
  } else {
    weightKg = topSetWeightKg ?? lastSameWeightKg;
  }

  return { setType: kind, weightKg, repMin, repMax };
}
