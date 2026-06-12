import { db } from './client';
import { exercise } from './schema';

export type Exercise = typeof exercise.$inferSelect;

const STARTER: { name: string; muscleGroup: string; pattern: string }[] = [
  { name: 'Press inclinado', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press banca', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press plano mancuerna', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Aperturas', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Fondos', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press militar', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Elevaciones laterales', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Press francés', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Extensión tríceps polea', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Jalón al pecho', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo mancuerna', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo barra', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Curl bíceps', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Sentadilla', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Hack squat', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Prensa', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Peso muerto rumano', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Curl femoral', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Extensión cuádriceps', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Gemelo de pie', muscleGroup: 'gemelo', pattern: 'pierna' },
];

/** Siembra el catálogo inicial si la tabla está vacía. */
export async function seedExercisesIfEmpty(): Promise<void> {
  const existing = await db.select().from(exercise).limit(1);
  if (existing.length === 0) {
    await db.insert(exercise).values(STARTER.map((e) => ({ ...e, isCustom: false })));
  }
}

export async function listExercises(): Promise<Exercise[]> {
  return db.select().from(exercise);
}

export async function addExercise(name: string, muscleGroup: string, pattern: string): Promise<void> {
  await db.insert(exercise).values({ name, muscleGroup, pattern, isCustom: true });
}
