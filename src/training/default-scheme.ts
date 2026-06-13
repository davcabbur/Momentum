import { type Level } from './levels';

const COMPOUNDS = new Set([
  'Press inclinado',
  'Press banca',
  'Press plano mancuerna',
  'Fondos',
  'Press militar',
  'Jalón al pecho',
  'Remo mancuerna',
  'Remo barra',
  'Sentadilla',
  'Hack squat',
  'Prensa',
  'Peso muerto rumano',
]);

const ISOLATION = new Set([
  'Aperturas',
  'Elevaciones laterales',
  'Press francés',
  'Extensión tríceps polea',
  'Extensión tríceps sobre la cabeza',
  'Patada de tríceps',
  'Extensión tríceps unilateral',
  'Curl bíceps',
  'Curl femoral',
  'Extensión cuádriceps',
  'Gemelo de pie',
]);

/**
 * Esquema de partida por ejercicio: compuestos a menos reps (más fuerza),
 * aislamiento a más reps. Editable después por el usuario.
 */
export function defaultScheme(exerciseName: string, level: Level): { sets: number; repMin: number; repMax: number } {
  const sets = level === 'principiante' ? 3 : 4;
  if (COMPOUNDS.has(exerciseName)) return { sets, repMin: 6, repMax: 10 };
  if (ISOLATION.has(exerciseName)) return { sets: 3, repMin: 10, repMax: 15 };
  return { sets: 3, repMin: 8, repMax: 12 };
}
