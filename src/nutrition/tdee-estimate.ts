const KCAL_PER_KG = 7700;

/**
 * Estima tu gasto real (TDEE) a partir de datos: lo que comes de media y cómo
 * cambia tu peso de tendencia en el mismo periodo. Es el corazón de las
 * "kcal vivas": si comiendo X de media subes/bajas Y kg, tu mantenimiento real
 * = X menos el superávit/déficit que explica ese cambio.
 *
 * Devuelve null si no hay datos suficientes (pocos días registrados o periodo corto).
 */
export function estimateRealTdee(p: {
  avgIntakeKcal: number;
  weightChangeKg: number; // tendencia final - inicial (negativo = bajaste)
  spanDays: number;
  loggedDays: number; // días con comida registrada en el periodo
}): number | null {
  if (p.loggedDays < 7 || p.spanDays < 7) return null;
  const dailyBalance = (p.weightChangeKg * KCAL_PER_KG) / p.spanDays; // >0 si engordaste
  return Math.round(p.avgIntakeKcal - dailyBalance);
}
