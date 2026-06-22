/**
 * Estimación honesta de las kcal quemadas en una sesión de fuerza.
 *
 * No guardamos la duración de la sesión, así que estimamos a partir de las series
 * de trabajo (sin calentamiento) y el peso corporal:
 *   - Cada serie de trabajo ≈ MIN_PER_SET minutos (esfuerzo + descanso).
 *   - El entrenamiento de fuerza ronda los 5 MET (vigoroso ≈ 6, moderado ≈ 3,5).
 *   - kcal/min = MET × 3,5 × kg / 200  (fórmula MET estándar).
 *
 * Es una media orientativa, no una medición. Sirve para sumar al margen del día,
 * no para presionar.
 */
const MIN_PER_SET = 3;
const MET_STRENGTH = 5;

export function estimateWorkoutKcal({
  workingSets,
  bodyweightKg,
}: {
  workingSets: number;
  bodyweightKg: number;
}): number {
  if (workingSets <= 0 || bodyweightKg <= 0) return 0;
  const minutes = workingSets * MIN_PER_SET;
  const kcalPerMin = (MET_STRENGTH * 3.5 * bodyweightKg) / 200;
  return Math.round(kcalPerMin * minutes);
}
