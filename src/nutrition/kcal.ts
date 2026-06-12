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
