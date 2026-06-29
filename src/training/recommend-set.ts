import { type RepRange } from './progression';

export type SetKind = 'top' | 'backoff' | 'normal';

export interface SetRecommendation {
  setType: SetKind;
  weightKg: number | null; // null si no hay datos para sugerir (primera vez)
  repMin: number;
  repMax: number;
}

/** Lo que se hizo en una serie de trabajo (para la progresión guiada por RIR). */
export interface LastPerf {
  weightKg: number;
  reps: number;
  rir: number | null;
}

/** El back-off se hace ~10% por debajo del top set (más reps, menos carga). */
const BACKOFF_FACTOR = 0.9;

/** Redondea a placa realista: de 2,5 en 2,5 kg (1 en 1 con pesos bajos). */
function roundPlate(w: number): number {
  return w < 20 ? Math.round(w) : Math.round(w / 2.5) * 2.5;
}

/** Incremento de peso según el peso actual (saltos pequeños en pesos bajos). */
function increment(weightKg: number): number {
  return weightKg < 20 ? 1 : 2.5;
}

/** Tipo de serie por defecto: en compuestos 1ª = top set, resto = back-off; aislamiento = normal. */
export function defaultSetKind(setNumber: number, isCompound: boolean): SetKind {
  if (!isCompound) return 'normal';
  return setNumber === 1 ? 'top' : 'backoff';
}

/**
 * Doble progresión guiada por RIR (modo estándar). A partir de la serie de trabajo más
 * pesada de la última sesión decide el peso de trabajo de hoy:
 * - Llegaste al tope de reps con RIR de sobra (≥ objetivo+2) → salto doble.
 * - Llegaste al tope de reps con RIR justo → +1 escalón.
 * - Dentro del rango o por debajo → mismo peso (primero se sube de reps, no de peso).
 */
export function progressiveWeight(last: LastPerf, scheme: RepRange, targetRir: number): number {
  const inc = increment(last.weightKg);
  if (last.reps >= scheme.repMax) {
    const hasReserve = last.rir != null && last.rir - targetRir >= 2;
    return roundPlate(last.weightKg + (hasReserve ? 2 * inc : inc));
  }
  return roundPlate(last.weightKg);
}

export interface RecommendInput {
  setNumber: number;
  isCompound: boolean;
  scheme: RepRange;
  /** RIR objetivo (extremo bajo del rango del nivel), para decidir cuándo subir peso. */
  targetRir: number;
  /** Serie de trabajo más pesada YA hecha hoy (ancla la sesión; no se sube a media sesión). */
  todayTopWeightKg: number | null;
  /** Serie de trabajo más pesada de la última sesión (peso/reps/RIR) para progresar. */
  lastWorkTop: LastPerf | null;
  /** Dominadas/fondos: el peso es corporal, el back-off no se reduce. */
  bodyweightLoaded?: boolean;
}

/**
 * Recomienda tipo de serie, peso y rango de reps para una serie concreta.
 * El peso de trabajo de la sesión sale de lo ya hecho hoy (manda) o, si no, de la
 * doble progresión guiada por RIR desde la última sesión. El top set va a la parte
 * baja del rango (más pesado); el back-off, ~10% más ligero y a más reps.
 */
export function recommendSet(input: RecommendInput): SetRecommendation {
  const { setNumber, isCompound, scheme, targetRir, todayTopWeightKg, lastWorkTop, bodyweightLoaded } = input;
  const kind = defaultSetKind(setNumber, isCompound);

  let repMin = scheme.repMin;
  let repMax = scheme.repMax;
  if (kind === 'top') {
    repMax = Math.min(scheme.repMax, scheme.repMin + 2);
  } else if (kind === 'backoff') {
    repMin = Math.max(scheme.repMin, scheme.repMax - 2);
  }

  // Peso de trabajo de la sesión: lo ya hecho hoy manda; si no, la progresión desde la última vez.
  let workW: number | null;
  if (todayTopWeightKg != null) {
    workW = todayTopWeightKg;
  } else if (lastWorkTop != null) {
    workW = progressiveWeight(lastWorkTop, scheme, targetRir);
  } else {
    workW = null;
  }

  let weightKg: number | null;
  if (kind === 'backoff' && workW != null && !bodyweightLoaded) {
    weightKg = roundPlate(workW * BACKOFF_FACTOR);
  } else {
    weightKg = workW;
  }

  return { setType: kind, weightKg, repMin, repMax };
}
