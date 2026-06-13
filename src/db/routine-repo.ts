import { asc, eq } from 'drizzle-orm';

import { type Level } from '@/training/levels';
import { defaultScheme } from '@/training/default-scheme';
import { exercisesForType, type RoutineTemplate } from '@/training/routine-templates';
import { db } from './client';
import { listExercises } from './exercise-repo';
import { exercise, routine, routineDay, routineDayExercise } from './schema';

export type Routine = typeof routine.$inferSelect;
export type RoutineDay = typeof routineDay.$inferSelect;
export type Exercise = typeof exercise.$inferSelect;
export interface DayExercise {
  rdeId: number;
  exercise: Exercise;
  targetSets: number | null;
  repMin: number | null;
  repMax: number | null;
}

export async function getActiveRoutine(): Promise<Routine | null> {
  const rows = await db.select().from(routine).limit(1);
  return rows[0] ?? null;
}

export async function createRoutine(name: string): Promise<number> {
  const res = await db.insert(routine).values({ name }).returning({ id: routine.id });
  return res[0].id;
}

/** Borra la rutina actual (y sus días/ejercicios). El historial de sesiones se conserva. */
export async function clearRoutine(): Promise<void> {
  const rs = await db.select().from(routine);
  for (const r of rs) {
    const ds = await db.select().from(routineDay).where(eq(routineDay.routineId, r.id));
    for (const d of ds) await db.delete(routineDayExercise).where(eq(routineDayExercise.routineDayId, d.id));
    await db.delete(routineDay).where(eq(routineDay.routineId, r.id));
  }
  await db.delete(routine);
}

/** Crea una rutina nueva con días predefinidos (de una plantilla). Reemplaza la anterior. */
export async function createRoutineWithDays(name: string, dayNames: string[]): Promise<number> {
  await clearRoutine();
  const id = await createRoutine(name);
  for (let i = 0; i < dayNames.length; i++) {
    await db.insert(routineDay).values({ routineId: id, name: dayNames[i], orderIdx: i });
  }
  return id;
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

/** Ejercicios de un día, en orden, con su esquema (series/reps). */
export async function listDayExercises(dayId: number): Promise<DayExercise[]> {
  return db
    .select({
      rdeId: routineDayExercise.id,
      exercise,
      targetSets: routineDayExercise.targetSets,
      repMin: routineDayExercise.repMin,
      repMax: routineDayExercise.repMax,
    })
    .from(routineDayExercise)
    .innerJoin(exercise, eq(routineDayExercise.exerciseId, exercise.id))
    .where(eq(routineDayExercise.routineDayId, dayId))
    .orderBy(asc(routineDayExercise.orderIdx));
}

export async function addExerciseToDay(
  dayId: number,
  exerciseId: number,
  scheme?: { targetSets: number; repMin: number; repMax: number },
): Promise<void> {
  const current = await db.select().from(routineDayExercise).where(eq(routineDayExercise.routineDayId, dayId));
  await db.insert(routineDayExercise).values({
    routineDayId: dayId,
    exerciseId,
    orderIdx: current.length,
    targetSets: scheme?.targetSets ?? null,
    repMin: scheme?.repMin ?? null,
    repMax: scheme?.repMax ?? null,
  });
}

export async function updateDayExerciseScheme(
  rdeId: number,
  scheme: { targetSets: number; repMin: number; repMax: number },
): Promise<void> {
  await db.update(routineDayExercise).set(scheme).where(eq(routineDayExercise.id, rdeId));
}

export async function removeExerciseFromDay(rdeId: number): Promise<void> {
  await db.delete(routineDayExercise).where(eq(routineDayExercise.id, rdeId));
}

/** Crea la rutina desde una plantilla: días + ejercicios por defecto con esquema según nivel. */
export async function createRoutineFromTemplate(template: RoutineTemplate, level: Level): Promise<number> {
  await clearRoutine();
  const id = await createRoutine(template.name);
  const all = await listExercises();
  const byName = new Map(all.map((e) => [e.name, e.id]));
  for (let i = 0; i < template.days.length; i++) {
    const d = template.days[i];
    const dayRes = await db
      .insert(routineDay)
      .values({ routineId: id, name: d.name, orderIdx: i })
      .returning({ id: routineDay.id });
    const dayId = dayRes[0].id;
    const names = exercisesForType(d.type);
    for (let j = 0; j < names.length; j++) {
      const exId = byName.get(names[j]);
      if (exId != null) {
        const sc = defaultScheme(names[j], level);
        await db.insert(routineDayExercise).values({
          routineDayId: dayId,
          exerciseId: exId,
          orderIdx: j,
          targetSets: sc.sets,
          repMin: sc.repMin,
          repMax: sc.repMax,
        });
      }
    }
  }
  return id;
}
