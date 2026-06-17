import { type Level } from './levels';

const COMPOUNDS = new Set([
  'Press inclinado',
  'Press inclinado con barra',
  'Press banca',
  'Press plano mancuerna',
  'Fondos',
  'Press declinado',
  'Press Larson',
  'Press militar',
  'Press Arnold',
  'Press hombro en máquina',
  'Press militar con barra',
  'Jalón al pecho',
  'Remo mancuerna',
  'Remo barra',
  'Dominadas',
  'Remo Gironda',
  'Remo en máquina',
  'Remo croc',
  'Remo Meadows',
  'Remo invertido',
  'Sentadilla',
  'Sentadilla con pausa',
  'Hack squat',
  'Prensa',
  'Peso muerto rumano',
  'Peso muerto',
  'Peso muerto con barra trap',
  'Peso muerto piernas rígidas',
  'Zancadas',
  'Sentadilla búlgara',
  'Hip thrust',
  'Hip thrust en máquina',
  'Subida al cajón',
]);

const ISOLATION = new Set([
  'Aperturas',
  'Elevación frontal con disco',
  'Flexiones diamante',
  'Cruces en polea',
  'Elevaciones laterales',
  'Pájaros',
  'Elevaciones laterales en polea',
  'Elevación en Y en polea',
  'Aperturas inversas',
  'Press francés',
  'Extensión tríceps polea',
  'Extensión tríceps sobre la cabeza',
  'Patada de tríceps',
  'Extensión tríceps unilateral',
  'Curl bíceps',
  'Curl inclinado',
  'Curl concentrado',
  'Curl martillo',
  'Curl predicador',
  'Curl con barra Z',
  'Curl Bayesiano',
  'Curl overhead en polea',
  'Jalón unilateral arrodillado',
  'Encogimiento en polea',
  'Curl femoral',
  'Curl femoral sentado',
  'Extensión cuádriceps',
  'Gemelo de pie',
  'Gemelo en prensa',
  'Gemelo sentado',
  'Curl nórdico',
  'Crunch declinado',
  'Face pull',
  'Encogimiento de hombros',
  'Encogimientos de Kelso',
  'Dominadas escapulares',
  'Pullover',
  'Pullover en polea',
  'Crunch',
  'Elevación de piernas',
  'Rotación de torso',
  'Plancha',
  'Puente de glúteo',
  'Hip thrust unilateral',
  'Hiperextensión 45°',
  'Patada de glúteo',
  'Abducción de cadera',
  'Colgarse en barra',
]);

// Antebrazo/muñeca: recorrido corto → reps altas.
const HIGH_REP = new Set(['Curl de muñeca', 'Curl inverso', 'Extensión de muñeca']);

/**
 * Esquema de partida por ejercicio: compuestos a menos reps (más fuerza),
 * aislamiento a más reps. Editable después por el usuario.
 */
export function defaultScheme(exerciseName: string, level: Level): { sets: number; repMin: number; repMax: number } {
  const beginner = level === 'principiante';
  const sets = beginner ? 3 : 4;
  if (HIGH_REP.has(exerciseName)) return { sets: 3, repMin: 12, repMax: 20 };
  // Compuestos: principiante a reps más altas (técnica y seguridad); intermedio/avanzado más pesado.
  if (COMPOUNDS.has(exerciseName)) return beginner ? { sets: 3, repMin: 8, repMax: 12 } : { sets, repMin: 6, repMax: 10 };
  if (ISOLATION.has(exerciseName)) return { sets: 3, repMin: 10, repMax: 15 };
  return { sets: 3, repMin: 8, repMax: 12 };
}
