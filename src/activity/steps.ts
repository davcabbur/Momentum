import { addDays } from '@/bodyweight/goal';

export interface DaySteps {
  date: string; // YYYY-MM-DD
  steps: number;
}

/** Progreso 0..100 hacia la meta del día. */
export function goalProgress(steps: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, (steps / goal) * 100));
}

/** Media de pasos de los últimos 7 días con dato (entero). */
export function weeklyAverage(days: DaySteps[]): number {
  const last7 = days.slice(-7);
  if (last7.length === 0) return 0;
  return Math.round(last7.reduce((a, d) => a + d.steps, 0) / last7.length);
}

/**
 * Días consecutivos cumpliendo la meta. Hoy cuenta solo si ya se alcanzó;
 * si no, la racha se cuenta hacia atrás desde ayer. Un día por debajo (o sin dato) la corta.
 */
export function computeStreak(days: DaySteps[], goal: number, todayIso: string): number {
  const map = new Map(days.map((d) => [d.date, d.steps]));
  let cursor = (map.get(todayIso) ?? 0) >= goal ? todayIso : addDays(todayIso, -1);
  let streak = 0;
  while ((map.get(cursor) ?? 0) >= goal) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Serie continua de fromIso..toIso (inclusive) rellenando huecos con 0. */
export function trendSeries(days: DaySteps[], fromIso: string, toIso: string): DaySteps[] {
  const map = new Map(days.map((d) => [d.date, d.steps]));
  const out: DaySteps[] = [];
  let cur = fromIso;
  while (cur <= toIso) {
    out.push({ date: cur, steps: map.get(cur) ?? 0 });
    cur = addDays(cur, 1);
  }
  return out;
}
