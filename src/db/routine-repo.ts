import { asc, eq } from 'drizzle-orm';

import { db } from './client';
import { exercise, routine, routineDay, routineDayExercise } from './schema';

export type Routine = typeof routine.$inferSelect;
export type RoutineDay = typeof routineDay.$inferSelect;
export type Exercise = typeof exercise.$inferSelect;

export async function getActiveRoutine(): Promise<Routine | null> {
  const rows = await db.select().from(routine).limit(1);
  return rows[0] ?? null;
}

export async function createRoutine(name: string): Promise<number> {
  const res = await db.insert(routine).values({ name }).returning({ id: routine.id });
  return res[0].id;
}

export async function listDays(routineId: number): Promise<RoutineDay[]> {
  return db.select().from(routineDay).where(eq(routineDay.routineId, routineId)).orderBy(asc(routineDay.orderIdx));
}

export async function addDay(routineId: number, name: string): Promise<number> {
  const days = await listDays(routineId);
  const res = await db
    .insert(routineDay)
    .values({ routineId, name, orderIdx: days.length })
    .returning({ id: routineDay.id });
  return res[0].id;
}

export async function deleteDay(dayId: number): Promise<void> {
  await db.delete(routineDayExercise).where(eq(routineDayExercise.routineDayId, dayId));
  await db.delete(routineDay).where(eq(routineDay.id, dayId));
}

/** Ejercicios de un día, en orden, con sus datos. */
export async function listDayExercises(dayId: number): Promise<{ rdeId: number; exercise: Exercise }[]> {
  return db
    .select({ rdeId: routineDayExercise.id, exercise })
    .from(routineDayExercise)
    .innerJoin(exercise, eq(routineDayExercise.exerciseId, exercise.id))
    .where(eq(routineDayExercise.routineDayId, dayId))
    .orderBy(asc(routineDayExercise.orderIdx));
}

export async function addExerciseToDay(dayId: number, exerciseId: number): Promise<void> {
  const current = await db.select().from(routineDayExercise).where(eq(routineDayExercise.routineDayId, dayId));
  await db.insert(routineDayExercise).values({ routineDayId: dayId, exerciseId, orderIdx: current.length });
}

export async function removeExerciseFromDay(rdeId: number): Promise<void> {
  await db.delete(routineDayExercise).where(eq(routineDayExercise.id, rdeId));
}
