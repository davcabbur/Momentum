import { proteinTarget } from './kcal';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const FAT_PCT = 0.27; // ~27 % de las kcal a grasa; el resto a carbos tras fijar proteína

/**
 * Reparte las kcal objetivo en gramos de proteína/carbos/grasa.
 * Proteína = la regla de proteína alta por etapa; grasa ~27 % de kcal; carbos, el resto.
 */
export function macroTargets(kcalTarget: number, weightKg: number, stage: string): Macros {
  const protein = proteinTarget(weightKg, stage);
  const proteinKcal = protein * 4;
  const fat = Math.round((kcalTarget * FAT_PCT) / 9);
  const carbsKcal = Math.max(0, kcalTarget - proteinKcal - fat * 9);
  return { kcal: Math.round(kcalTarget), protein, carbs: Math.round(carbsKcal / 4), fat };
}

/** Macros de una ración a partir de los valores por 100 g. */
export function portionMacros(per100: Macros, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    protein: Math.round(per100.protein * f * 10) / 10,
    carbs: Math.round(per100.carbs * f * 10) / 10,
    fat: Math.round(per100.fat * f * 10) / 10,
  };
}

/** Suma de macros de varias raciones. */
export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
