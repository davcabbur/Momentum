/** 1RM estimado (fórmula de Epley). Con 1 rep = el propio peso. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/** Mejor 1RM estimado de un conjunto de series (para PRs). */
export function bestOneRepMax(sets: { weightKg: number; reps: number }[]): number {
  return sets.reduce((best, s) => Math.max(best, estimateOneRepMax(s.weightKg, s.reps)), 0);
}

export interface RepRange {
  sets: number;
  repMin: number;
  repMax: number;
}

/** Incremento de peso sugerido según el peso actual (saltos pequeños en pesos bajos). */
function increment(weightKg: number): number {
  return weightKg < 20 ? 1 : 2.5;
}

export interface ProgressionHint {
  ready: boolean;
  suggestedWeightKg: number | null;
  text: string;
}

/**
 * Doble progresión: si en la última sesión TODAS las series de trabajo llegaron
 * al tope del rango de reps, toca subir el peso (y volver al extremo bajo del rango).
 */
export function progressionHint(lastSets: { weightKg: number; reps: number }[], scheme: RepRange): ProgressionHint {
  if (lastSets.length === 0) {
    return { ready: false, suggestedWeightKg: null, text: 'Registra una sesión para ver tu progresión.' };
  }
  const allHitTop = lastSets.length >= scheme.sets && lastSets.every((s) => s.reps >= scheme.repMax);
  if (allHitTop) {
    const maxW = Math.max(...lastSets.map((s) => s.weightKg));
    const suggested = Math.round((maxW + increment(maxW)) * 10) / 10;
    const w = String(suggested).replace('.', ',');
    return {
      ready: true,
      suggestedWeightKg: suggested,
      text: `¡A subir peso! Llegaste a ${scheme.repMax} reps en todas las series. Prueba ${w} kg y vuelve a ${scheme.repMin} reps.`,
    };
  }
  return {
    ready: false,
    suggestedWeightKg: null,
    text: `Busca llegar a ${scheme.repMax} reps en todas las series (con buena técnica) antes de subir peso.`,
  };
}

/** Volumen de una sesión: suma de peso × reps de las series. */
export function sessionVolume(sets: { weightKg: number; reps: number }[]): number {
  return sets.reduce((total, s) => total + s.weightKg * s.reps, 0);
}

export interface HistoryRow {
  exerciseId: number;
  name: string;
  sessionId: number;
  date: string;
  weightKg: number;
  reps: number;
  setType: string;
}

export interface SessionPoint {
  date: string;
  e1rm: number;
  volume: number;
}

export interface ExerciseProgress {
  exerciseId: number;
  name: string;
  points: SessionPoint[];
  bestE1rm: number;
  lastVolume: number;
}

/**
 * Agrupa el historial plano (una fila por serie) en progreso por ejercicio:
 * un punto por sesión con su 1RM estimado y su volumen. Las series de
 * calentamiento no cuentan para PRs ni volumen.
 * Espera las filas ordenadas por fecha ascendente.
 */
export function buildProgress(rows: HistoryRow[]): ExerciseProgress[] {
  const byEx = new Map<number, { name: string; sessions: Map<number, { date: string; sets: { weightKg: number; reps: number }[] }> }>();
  for (const r of rows) {
    if (r.setType === 'warmup') continue;
    let ex = byEx.get(r.exerciseId);
    if (!ex) {
      ex = { name: r.name, sessions: new Map() };
      byEx.set(r.exerciseId, ex);
    }
    let s = ex.sessions.get(r.sessionId);
    if (!s) {
      s = { date: r.date, sets: [] };
      ex.sessions.set(r.sessionId, s);
    }
    s.sets.push({ weightKg: r.weightKg, reps: r.reps });
  }

  const out: ExerciseProgress[] = [];
  for (const [exerciseId, ex] of byEx) {
    const points = [...ex.sessions.values()].map((s) => ({
      date: s.date,
      e1rm: bestOneRepMax(s.sets),
      volume: sessionVolume(s.sets),
    }));
    const bestE1rm = points.reduce((m, p) => Math.max(m, p.e1rm), 0);
    out.push({ exerciseId, name: ex.name, points, bestE1rm, lastVolume: points[points.length - 1]?.volume ?? 0 });
  }
  out.sort((a, b) =>
    (b.points[b.points.length - 1]?.date ?? '').localeCompare(a.points[a.points.length - 1]?.date ?? ''),
  );
  return out;
}
