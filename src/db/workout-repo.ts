import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from './client';
import { exercise, routineDay, setLog, workoutSession } from './schema';
import type { HistoryRow } from '@/training/progression';

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

export interface SessionExercise {
  name: string;
  sets: { weightKg: number; reps: number; rir: number | null; setType: string }[];
}
export interface SessionSummary {
  sessionId: number;
  date: string;
  dayName: string | null;
  totalSets: number;
  totalVolume: number;
  exercises: SessionExercise[];
}

/** Sesiones pasadas (con al menos una serie), de la más reciente a la más antigua. */
export async function listSessions(limit = 60): Promise<SessionSummary[]> {
  const rows = await db
    .select({
      sessionId: workoutSession.id,
      date: workoutSession.date,
      dayName: routineDay.name,
      exName: exercise.name,
      weightKg: setLog.weightKg,
      reps: setLog.reps,
      rir: setLog.rir,
      setType: setLog.setType,
    })
    .from(setLog)
    .innerJoin(workoutSession, eq(setLog.sessionId, workoutSession.id))
    .leftJoin(routineDay, eq(workoutSession.routineDayId, routineDay.id))
    .innerJoin(exercise, eq(setLog.exerciseId, exercise.id))
    .orderBy(desc(workoutSession.date), desc(workoutSession.id), asc(setLog.setNumber));

  const byId = new Map<number, SessionSummary>();
  for (const r of rows) {
    let s = byId.get(r.sessionId);
    if (!s) {
      s = { sessionId: r.sessionId, date: r.date, dayName: r.dayName, totalSets: 0, totalVolume: 0, exercises: [] };
      byId.set(r.sessionId, s);
    }
    let ex = s.exercises.find((e) => e.name === r.exName);
    if (!ex) {
      ex = { name: r.exName, sets: [] };
      s.exercises.push(ex);
    }
    ex.sets.push({ weightKg: r.weightKg, reps: r.reps, rir: r.rir, setType: r.setType });
    s.totalSets += 1;
    if (r.setType !== 'warmup') s.totalVolume += r.weightKg * r.reps;
  }
  return [...byId.values()].slice(0, limit);
}

/** Fecha (YYYY-MM-DD) de la sesión más reciente, o null si no hay ninguna. */
export async function lastSessionDate(): Promise<string | null> {
  const rows = await db
    .select({ date: workoutSession.date })
    .from(workoutSession)
    .orderBy(desc(workoutSession.date))
    .limit(1);
  return rows[0]?.date ?? null;
}

/** Historial completo (una fila por serie), ordenado por fecha, para construir el progreso. */
export async function getHistoryRows(): Promise<HistoryRow[]> {
  return db
    .select({
      exerciseId: setLog.exerciseId,
      name: exercise.name,
      sessionId: setLog.sessionId,
      date: workoutSession.date,
      weightKg: setLog.weightKg,
      reps: setLog.reps,
      setType: setLog.setType,
    })
    .from(setLog)
    .innerJoin(workoutSession, eq(setLog.sessionId, workoutSession.id))
    .innerJoin(exercise, eq(setLog.exerciseId, exercise.id))
    .orderBy(asc(workoutSession.date), asc(workoutSession.id));
}
