const MS_PER_DAY = 86_400_000;

export function addDays(isoDate: string, days: number): string {
  const t = new Date(isoDate + 'T00:00:00Z').getTime() + days * MS_PER_DAY;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + 'T00:00:00Z').getTime();
  const b = new Date(toIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Días estimados hasta el objetivo según la pendiente actual.
 * Devuelve null si la tendencia no avanza hacia el objetivo (sin presión: "sigue registrando").
 */
export function estimateDaysToGoal(p: {
  currentTrendKg: number;
  goalKg: number;
  slopePerWeek: number;
}): number | null {
  const remaining = p.goalKg - p.currentTrendKg; // signo = hacia dónde hay que ir
  if (remaining === 0) return 0;
  const slopePerDay = p.slopePerWeek / 7;
  if (slopePerDay === 0) return null;
  if (Math.sign(remaining) !== Math.sign(slopePerDay)) return null;
  return Math.round(remaining / slopePerDay);
}

function clampPct(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/** % del camino recorrido del peso inicial al objetivo (0..100). */
export function goalProgressPct(p: { startKg: number; currentTrendKg: number; goalKg: number }): number {
  const total = p.startKg - p.goalKg;
  if (total === 0) return 100;
  return clampPct(((p.startKg - p.currentTrendKg) / total) * 100);
}

/** % del tiempo estimado transcurrido (0..100). Orientativo, nunca una fecha límite. */
export function timeElapsedPct(p: { startDate: string; asOf: string; estimatedTotalDays: number }): number {
  if (p.estimatedTotalDays <= 0) return 0;
  const elapsed = daysBetween(p.startDate, p.asOf);
  return clampPct((elapsed / p.estimatedTotalDays) * 100);
}
