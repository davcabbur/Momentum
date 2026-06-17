import { db } from './client';
import { exercise } from './schema';

export type Exercise = typeof exercise.$inferSelect;

const STARTER: { name: string; muscleGroup: string; pattern: string }[] = [
  { name: 'Press inclinado', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press banca', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press plano mancuerna', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Aperturas', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Fondos', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Cruces en polea', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press declinado', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press Larson', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press militar', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Elevaciones laterales', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Pájaros', muscleGroup: 'hombro', pattern: 'tiron' },
  { name: 'Press hombro en máquina', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Press militar con barra', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Elevaciones laterales en polea', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Elevación en Y en polea', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Press Arnold', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Aperturas inversas', muscleGroup: 'hombro', pattern: 'tiron' },
  { name: 'Press francés', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Extensión tríceps polea', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Extensión tríceps sobre la cabeza', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Patada de tríceps', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Extensión tríceps unilateral', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Jalón al pecho', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo mancuerna', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo barra', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Dominadas', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo Gironda', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo en máquina', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Pullover', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Encogimiento de hombros', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Face pull', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Encogimientos de Kelso', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Dominadas escapulares', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Curl bíceps', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Curl inclinado', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Curl concentrado', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Curl martillo', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Curl predicador', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Curl con barra Z', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Curl Bayesiano', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Sentadilla', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Hack squat', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Prensa', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Peso muerto rumano', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Curl femoral', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Extensión cuádriceps', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Gemelo de pie', muscleGroup: 'gemelo', pattern: 'pierna' },
  { name: 'Zancadas', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Sentadilla búlgara', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Hip thrust', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Hip thrust en máquina', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Hip thrust unilateral', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Puente de glúteo', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Subida al cajón', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Hiperextensión 45°', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Patada de glúteo', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Abducción de cadera', muscleGroup: 'gluteo', pattern: 'pierna' },
  { name: 'Crunch', muscleGroup: 'core', pattern: 'otro' },
  { name: 'Elevación de piernas', muscleGroup: 'core', pattern: 'otro' },
  { name: 'Rotación de torso', muscleGroup: 'core', pattern: 'otro' },
  { name: 'Plancha', muscleGroup: 'core', pattern: 'otro' },
  { name: 'Colgarse en barra', muscleGroup: 'antebrazo', pattern: 'otro' },
  { name: 'Curl de muñeca', muscleGroup: 'antebrazo', pattern: 'otro' },
  { name: 'Curl inverso', muscleGroup: 'antebrazo', pattern: 'tiron' },
  { name: 'Extensión de muñeca', muscleGroup: 'antebrazo', pattern: 'otro' },
];

/** Asegura el catálogo: inserta los ejercicios del catálogo que falten (por nombre). */
export async function seedExercises(): Promise<void> {
  const existing = await db.select().from(exercise);
  const have = new Set(existing.map((e) => e.name));
  const missing = STARTER.filter((e) => !have.has(e.name));
  if (missing.length > 0) {
    await db.insert(exercise).values(missing.map((e) => ({ ...e, isCustom: false })));
  }
}

export async function listExercises(): Promise<Exercise[]> {
  return db.select().from(exercise);
}

export async function addExercise(name: string, muscleGroup: string, pattern: string): Promise<void> {
  await db.insert(exercise).values({ name, muscleGroup, pattern, isCustom: true });
}
