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

/**
 * Sugerencia automática de objetivo (peso + fecha) según la etapa, para el onboarding.
 * Son valores orientativos y editables: ritmos saludables por defecto.
 */
export function suggestGoal(p: {
  initialKg: number;
  stage: string;
  startDate: string;
}): { targetKg: number; targetDate: string } {
  const round05 = (x: number) => Math.round(x * 2) / 2;
  let targetKg: number;
  let weeks: number;

  if (p.stage === 'definicion') {
    targetKg = round05(p.initialKg * 0.92); // perder ~8 %
    const ratePerWeek = p.initialKg * 0.005; // ~0,5 %/semana
    weeks = ratePerWeek > 0 ? (p.initialKg - targetKg) / ratePerWeek : 12;
  } else if (p.stage === 'volumen') {
    targetKg = round05(p.initialKg * 1.05); // ganar ~5 %
    const ratePerWeek = p.initialKg * 0.003; // ~0,3 %/semana
    weeks = ratePerWeek > 0 ? (targetKg - p.initialKg) / ratePerWeek : 12;
  } else {
    // normocalórica / recomposición: mantener peso, horizonte de revisión
    targetKg = round05(p.initialKg);
    weeks = 12;
  }

  return { targetKg, targetDate: addDays(p.startDate, Math.round(weeks * 7)) };
}
