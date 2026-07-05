/**
 * Puntuación de ranking por fuerza relativa (Big 3) usando el coeficiente DOTS,
 * el estándar actual de powerlifting que ajusta el total levantado por peso corporal
 * y sexo. Así se compara "quién es más fuerte para su tamaño", no quién pesa más.
 */
export type Sex = 'male' | 'female';

// Coeficientes DOTS (2019). DOTS = total × 500 / (a·bw⁴ + b·bw³ + c·bw² + d·bw + e).
const COEF: Record<Sex, [number, number, number, number, number]> = {
  male: [-0.000001093, 0.0007391293, -0.1918759221, 24.0900756, -307.75076],
  female: [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288],
};

/** Puntos DOTS de un total (kg) para un peso corporal (kg) y sexo. 0 si no hay datos válidos. */
export function dots(totalKg: number, bodyweightKg: number, sex: Sex): number {
  if (totalKg <= 0 || bodyweightKg <= 0) return 0;
  const c = COEF[sex];
  const bw = Math.min(Math.max(bodyweightKg, 40), 210); // rango válido de la fórmula
  const denom = c[0] * bw ** 4 + c[1] * bw ** 3 + c[2] * bw ** 2 + c[3] * bw + c[4];
  if (denom <= 0) return 0;
  return Math.round((totalKg * 500) / denom * 10) / 10;
}

export interface Big3 {
  squat: number;
  bench: number;
  dead: number;
  bodyweightKg: number;
  sex: Sex;
}

/** DOTS del Big 3. Devuelve 0 si falta alguno de los tres lifts (ranking incompleto). */
export function big3Dots(p: Big3): number {
  if (p.squat <= 0 || p.bench <= 0 || p.dead <= 0) return 0;
  return dots(p.squat + p.bench + p.dead, p.bodyweightKg, p.sex);
}

/** Por encima de esto es implausible para datos autorreportados (posible error/trampa). */
export const MAX_PLAUSIBLE_DOTS = 700;

export function isPlausibleDots(d: number): boolean {
  return d > 0 && d <= MAX_PLAUSIBLE_DOTS;
}

export interface Tier {
  key: string;
  name: string;
}

// Ligas por umbral absoluto de DOTS (no percentil): nadie baja de liga porque entre gente más fuerte.
const TIERS: { min: number; key: string; name: string }[] = [
  { min: 500, key: 'challenger', name: 'Challenger' },
  { min: 450, key: 'granmaestro', name: 'Gran Maestro' },
  { min: 400, key: 'maestro', name: 'Maestro' },
  { min: 350, key: 'diamante', name: 'Diamante' },
  { min: 300, key: 'platino', name: 'Platino' },
  { min: 250, key: 'oro', name: 'Oro' },
  { min: 200, key: 'plata', name: 'Plata' },
  { min: 150, key: 'bronce', name: 'Bronce' },
  { min: 0, key: 'hierro', name: 'Hierro' },
];

export function tierForDots(d: number): Tier {
  const t = TIERS.find((x) => d >= x.min) ?? TIERS[TIERS.length - 1];
  return { key: t.key, name: t.name };
}
