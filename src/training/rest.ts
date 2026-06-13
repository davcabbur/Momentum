/**
 * Descanso recomendado entre series según el rango de reps:
 * a menos reps (más fuerza/compuestos) más descanso; a más reps, menos.
 */
export function recommendedRestSeconds(repMax: number): number {
  if (repMax <= 8) return 180; // fuerza / compuesto pesado: 2,5-3 min
  if (repMax <= 12) return 120; // hipertrofia: ~2 min
  return 90; // reps altas / aislamiento: 1-1,5 min
}
