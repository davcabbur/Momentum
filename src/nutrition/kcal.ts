import { daysBetween } from '@/bodyweight/goal';

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.9,
};

const KCAL_PER_KG = 7700; // ~kcal por kg de peso corporal (aprox.)

/** Metabolismo basal (Mifflin-St Jeor). */
export function bmrMifflin(p: { sex: string; age: number; heightCm: number; weightKg: number }): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === 'male' ? 5 : -161);
}

/** Gasto total diario (TDEE) = BMR × factor de actividad. */
export function tdee(p: {
  sex: string;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
}): number {
  return bmrMifflin(p) * (ACTIVITY_FACTOR[p.activityLevel] ?? 1.2);
}

export interface KcalPlan {
  bmr: number;
  tdee: number;
  /** Ajuste diario (negativo = déficit, positivo = superávit). */
  dailyDeltaKcal: number;
  /** Kcal/día objetivo. */
  kcal: number;
}

/**
 * Kcal/día realistas para llegar a `targetKg` en `targetDate` desde `currentKg`.
 * Usa 1 kg ≈ 7700 kcal repartidas en los días disponibles.
 */
export function kcalForTarget(p: {
  sex: string;
  age: number;
  heightCm: number;
  activityLevel: string;
  currentKg: number;
  targetKg: number;
  startDate: string;
  targetDate: string;
}): KcalPlan {
  const bmr = bmrMifflin({ sex: p.sex, age: p.age, heightCm: p.heightCm, weightKg: p.currentKg });
  const tdeeVal = bmr * (ACTIVITY_FACTOR[p.activityLevel] ?? 1.2);
  const days = daysBetween(p.startDate, p.targetDate);
  const dailyDeltaKcal = days > 0 ? ((p.targetKg - p.currentKg) * KCAL_PER_KG) / days : 0;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdeeVal),
    dailyDeltaKcal: Math.round(dailyDeltaKcal),
    kcal: Math.round(tdeeVal + dailyDeltaKcal),
  };
}

const PROTEIN_G_PER_KG: Record<string, number> = {
  definicion: 2.2,
  normocalorica: 2.0,
  volumen: 1.8,
};

/** Proteína objetivo (g/día). Regla de producto: proteína siempre alta; algo más en déficit. */
export function proteinTarget(weightKg: number, stage: string): number {
  const g = PROTEIN_G_PER_KG[stage] ?? 2.0;
  return Math.round(weightKg * g);
}

export type KcalTrack = 'sin-datos' | 'en-camino' | 'rapido' | 'lento';

export interface LiveKcalPlan {
  /** Mantenimiento estimado con el peso de tendencia. */
  tdee: number;
  /** Kcal/día objetivo para llegar a la meta desde hoy (estático). */
  targetKcal: number;
  /** Ritmo de peso necesario (kg/sem; negativo = bajar). */
  plannedRatePerWeek: number;
  /** Ritmo real según la tendencia suavizada (kg/sem); null si faltan datos. */
  actualRatePerWeek: number | null;
  /** Kcal/día ajustadas por tu tendencia real ("kcal vivas"); null si faltan datos. */
  adjustedKcal: number | null;
  track: KcalTrack;
}

/**
 * Plan de kcal "vivas": objetivo desde el peso de tendencia actual y los días que
 * quedan, y ajuste según tu ritmo real de peso (si bajas/subes más rápido o lento
 * de lo previsto, corrige las kcal). La tendencia manda, no el pesaje del día.
 */
export function liveKcalPlan(p: {
  sex: string;
  age: number;
  heightCm: number;
  activityLevel: string;
  trendKg: number;
  targetKg: number;
  daysRemaining: number;
  actualRatePerWeek: number | null;
}): LiveKcalPlan {
  const tdeeVal = tdee({
    sex: p.sex,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.trendKg,
    activityLevel: p.activityLevel,
  });
  const weeks = p.daysRemaining > 0 ? p.daysRemaining / 7 : 0;
  const plannedRate = weeks > 0 ? (p.targetKg - p.trendKg) / weeks : 0;
  const targetKcal = Math.round(tdeeVal + (plannedRate * KCAL_PER_KG) / 7);

  let adjustedKcal: number | null = null;
  let track: KcalTrack = 'sin-datos';
  if (p.actualRatePerWeek !== null) {
    const errorRate = p.actualRatePerWeek - plannedRate; // >0 = subes más / bajas menos de lo previsto
    adjustedKcal = Math.round(targetKcal - (errorRate * KCAL_PER_KG) / 7);
    const tol = 0.1; // kg/sem de margen
    if (Math.abs(errorRate) <= tol) {
      track = 'en-camino';
    } else {
      const dir = Math.sign(plannedRate) || -1;
      track = errorRate * dir > 0 ? 'rapido' : 'lento';
    }
  }

  return {
    tdee: Math.round(tdeeVal),
    targetKcal,
    plannedRatePerWeek: plannedRate,
    actualRatePerWeek: p.actualRatePerWeek,
    adjustedKcal,
    track,
  };
}
