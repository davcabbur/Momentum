import { type Level } from './levels';

const COMPOUNDS = new Set([
  'Press inclinado',
  'Press inclinado con barra',
  'Press de pecho en máquina',
  'Press banca',
  'Press plano mancuerna',
  'Fondos',
  'Press declinado',
  'Press Larson',
  'Press militar',
  'Press Arnold',
  'Press cerrado en banca',
  'Press hombro en máquina',
  'Press militar con barra',
  'Jalón al pecho',
  'Remo mancuerna',
  'Remo barra',
  'Remo Pendlay',
  'Dominadas',
  'Remo Gironda',
  'Remo en máquina',
  'Remo croc',
  'Remo Meadows',
  'Remo invertido',
  'Sentadilla',
  'Sentadilla con pausa',
  'Sentadilla frontal',
  'Sentadilla pendular',
  'Sentadilla en Smith',
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
  'Contractora de pecho',
  'Press cruzado en polea',
  'Elevación frontal con disco',
  'Flexiones diamante',
  'Cruces en polea',
  'Elevaciones laterales',
  'Pájaros',
  'Elevaciones laterales en polea',
  'Elevación en Y en polea',
  'Elevación lateral inclinada',
  'Elevación lateral en máquina',
  'Cruce inverso en polea',
  'Remo al mentón',
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
  'Curl martillo en predicador',
  'Curl tumbado',
  'Curl Zottman inverso',
  'Curl en polea',
  'Curl predicador',
  'Curl con barra Z',
  'Curl Bayesiano',
  'Curl overhead en polea',
  'Jalón unilateral arrodillado',
  'Encogimiento en polea',
  'Curl femoral',
  'Curl femoral sentado',
  'Nórdico inverso',
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

// Compuestos pesados (barra / patrón de fuerza): menos reps, enfoque de sobrecarga.
const HEAVY = new Set([
  'Sentadilla',
  'Sentadilla frontal',
  'Peso muerto',
  'Peso muerto con barra trap',
  'Peso muerto rumano',
  'Peso muerto piernas rígidas',
  'Press banca',
  'Press inclinado con barra',
  'Press militar con barra',
  'Remo barra',
  'Remo Pendlay',
  'Dominadas',
  'Press cerrado en banca',
]);

// Reps altas: recorrido corto o músculos que las toleran mejor (gemelo, core, abducción, antebrazo).
const HIGH_REP = new Set([
  'Curl de muñeca',
  'Curl inverso',
  'Extensión de muñeca',
  'Gemelo de pie',
  'Gemelo en prensa',
  'Gemelo sentado',
  'Crunch',
  'Crunch declinado',
  'Elevación de piernas',
  'Rotación de torso',
  'Abducción de cadera',
]);

/**
 * Esquema de partida por ejercicio (editable por el usuario), según la metodología:
 * - Compuesto pesado (barra): 4×6–8 (fuerza/sobrecarga).
 * - Compuesto de hipertrofia (máquina/mancuerna): 4×8–12.
 * - Aislamiento: 3×10–15.
 * - Reps altas (gemelo/core/abducción/antebrazo): 3×12–20.
 * - Principiante: 3 series y reps algo más altas/seguras.
 */
export function defaultScheme(exerciseName: string, level: Level): { sets: number; repMin: number; repMax: number } {
  const beginner = level === 'principiante';
  const sets = beginner ? 3 : 4;
  if (HIGH_REP.has(exerciseName)) return { sets: 3, repMin: 12, repMax: 20 };
  if (HEAVY.has(exerciseName)) return beginner ? { sets: 3, repMin: 8, repMax: 12 } : { sets, repMin: 6, repMax: 8 };
  if (COMPOUNDS.has(exerciseName)) return { sets, repMin: 8, repMax: 12 };
  if (ISOLATION.has(exerciseName)) return { sets: 3, repMin: 10, repMax: 15 };
  return { sets: 3, repMin: 8, repMax: 12 };
}
