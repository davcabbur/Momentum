import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from './client';
import { exercise, routineDay, setLog, workoutSession } from './schema';
import { bestOneRepMax, type HistoryRow } from '@/training/progression';

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

/** Busca la sesión de ese día+fecha SIN crearla (null si no existe). */
export async function findSession(date: string, routineDayId: number): Promise<number | null> {
  const rows = await db
    .select({ id: workoutSession.id })
    .from(workoutSession)
    .where(and(eq(workoutSession.date, date), eq(workoutSession.routineDayId, routineDayId)));
  return rows[0]?.id ?? null;
}

/** Borra las sesiones que se quedaron sin ninguna serie (p. ej. abriste un día y no registraste). */
export async function deleteEmptySessions(): Promise<void> {
  const sessions = await db.select({ id: workoutSession.id }).from(workoutSession);
  for (const s of sessions) {
    const sets = await db.select({ id: setLog.id }).from(setLog).where(eq(setLog.sessionId, s.id)).limit(1);
    if (sets.length === 0) await db.delete(workoutSession).where(eq(workoutSession.id, s.id));
  }
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
  note: string | null;
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
      note: workoutSession.note,
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
      s = { sessionId: r.sessionId, date: r.date, dayName: r.dayName, note: r.note, totalSets: 0, totalVolume: 0, exercises: [] };
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

/** Nº de series de trabajo (sin calentamiento) registradas en una fecha. */
export async function workingSetsOn(date: string): Promise<number> {
  const rows = await db
    .select({ setType: setLog.setType })
    .from(setLog)
    .innerJoin(workoutSession, eq(setLog.sessionId, workoutSession.id))
    .where(eq(workoutSession.date, date));
  return rows.filter((r) => r.setType !== 'warmup').length;
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

/** 1RM estimado por sesión de un ejercicio (orden cronológico), para detectar estancamiento. */
export async function exerciseE1rmHistory(exerciseId: number): Promise<number[]> {
  const rows = await db
    .select({ sessionId: setLog.sessionId, weightKg: setLog.weightKg, reps: setLog.reps, setType: setLog.setType })
    .from(setLog)
    .innerJoin(workoutSession, eq(setLog.sessionId, workoutSession.id))
    .where(eq(setLog.exerciseId, exerciseId))
    .orderBy(asc(workoutSession.date), asc(workoutSession.id));
  const bySession = new Map<number, { weightKg: number; reps: number }[]>();
  for (const r of rows) {
    if (r.setType === 'warmup') continue;
    const arr = bySession.get(r.sessionId) ?? [];
    arr.push({ weightKg: r.weightKg, reps: r.reps });
    bySession.set(r.sessionId, arr);
  }
  return [...bySession.values()].map((sets) => bestOneRepMax(sets));
}

/** Lee la nota de una sesión. */
export async function getSessionNote(sessionId: number): Promise<string | null> {
  const rows = await db.select({ note: workoutSession.note }).from(workoutSession).where(eq(workoutSession.id, sessionId));
  return rows[0]?.note ?? null;
}

/** Guarda (o limpia) la nota de una sesión. */
export async function setSessionNote(sessionId: number, note: string): Promise<void> {
  await db.update(workoutSession).set({ note: note.trim() || null }).where(eq(workoutSession.id, sessionId));
}

/** routineDayId de la sesión más reciente (para sugerir el siguiente día). */
export async function lastSessionDayId(): Promise<number | null> {
  const rows = await db
    .select({ dayId: workoutSession.routineDayId })
    .from(workoutSession)
    .orderBy(desc(workoutSession.date), desc(workoutSession.id))
    .limit(1);
  return rows[0]?.dayId ?? null;
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
