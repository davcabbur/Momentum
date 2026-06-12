import { and, desc, eq } from 'drizzle-orm';

import { db } from './client';
import { setLog, workoutSession } from './schema';

export type SetLog = typeof setLog.$inferSelect;

/** Devuelve la sesión de ese día+fecha; la crea si no existe. */
export async function getOrCreateSession(date: string, routineDayId: number): Promise<number> {
  const existing = await db
    .select()
    .from(workoutSession)
    .where(and(eq(workoutSession.date, date), eq(workoutSession.routineDayId, routineDayId)));
  if (existing[0]) return existing[0].id;
  const res = await db.insert(workoutSession).values({ date, routineDayId }).returning({ id: workoutSession.id });
  return res[0].id;
}

export async function listSets(sessionId: number, exerciseId: number): Promise<SetLog[]> {
  return db
    .select()
    .from(setLog)
    .where(and(eq(setLog.sessionId, sessionId), eq(setLog.exerciseId, exerciseId)))
    .orderBy(setLog.setNumber);
}

export async function upsertSet(p: {
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  setType: string;
}): Promise<void> {
  const existing = await db
    .select()
    .from(setLog)
    .where(
      and(eq(setLog.sessionId, p.sessionId), eq(setLog.exerciseId, p.exerciseId), eq(setLog.setNumber, p.setNumber)),
    );
  if (existing[0]) {
    await db
      .update(setLog)
      .set({ weightKg: p.weightKg, reps: p.reps, rir: p.rir, setType: p.setType })
      .where(eq(setLog.id, existing[0].id));
  } else {
    await db.insert(setLog).values(p);
  }
}

export async function deleteSet(setLogId: number): Promise<void> {
  await db.delete(setLog).where(eq(setLog.id, setLogId));
}

/** Series de la sesión anterior (distinta a la actual) más reciente con este ejercicio. */
export async function getLastPerformance(
  exerciseId: number,
  excludeSessionId: number,
): Promise<{ date: string; sets: SetLog[] } | null> {
  const rows = await db
    .select({ set: setLog, date: workoutSession.date, sessionId: workoutSession.id })
    .from(setLog)
    .innerJoin(workoutSession, eq(setLog.sessionId, workoutSession.id))
    .where(eq(setLog.exerciseId, exerciseId))
    .orderBy(desc(workoutSession.date), desc(workoutSession.id));
  const prev = rows.find((r) => r.sessionId !== excludeSessionId);
  if (!prev) return null;
  const sets = rows.filter((r) => r.sessionId === prev.sessionId).map((r) => r.set);
  return { date: prev.date, sets };
}
