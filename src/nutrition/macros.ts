import { proteinTarget } from './kcal';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Valores por 100 g / por ración, con detalle opcional (azúcares, fibra, saturadas). */
export interface Per100 extends Macros {
  sugars?: number | null;
  fiber?: number | null;
  satFat?: number | null;
}

/** Totales del día, con el detalle sumado. */
export interface FoodTotals extends Macros {
  sugars: number;
  fiber: number;
  satFat: number;
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

function scale1(v: number | null | undefined, f: number): number | null {
  return v == null ? null : Math.round(v * f * 10) / 10;
}

/** Macros (y detalle) de una ración a partir de los valores por 100 g. */
export function portionMacros(per100: Per100, grams: number): Per100 {
  const f = grams / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    protein: Math.round(per100.protein * f * 10) / 10,
    carbs: Math.round(per100.carbs * f * 10) / 10,
    fat: Math.round(per100.fat * f * 10) / 10,
    sugars: scale1(per100.sugars, f),
    fiber: scale1(per100.fiber, f),
    satFat: scale1(per100.satFat, f),
  };
}

type SumItem = Macros & { sugars?: number | null; fiber?: number | null; satFat?: number | null };

/** Suma de macros (y detalle) de varias raciones; los detalles ausentes cuentan como 0. */
export function sumMacros(entries: SumItem[]): FoodTotals {
  return entries.reduce<FoodTotals>(
    (a, e) => ({
      kcal: a.kcal + e.kcal,
      protein: a.protein + e.protein,
      carbs: a.carbs + e.carbs,
      fat: a.fat + e.fat,
      sugars: a.sugars + (e.sugars ?? 0),
      fiber: a.fiber + (e.fiber ?? 0),
      satFat: a.satFat + (e.satFat ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, sugars: 0, fiber: 0, satFat: 0 },
  );
}
