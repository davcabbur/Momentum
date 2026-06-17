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

/**
 * Valora un pesaje frente al anterior: ¿va hacia el objetivo y a qué ritmo?
 * - toward: true si el cambio va en la dirección del objetivo (verde), false si en contra (rojo).
 * - pct: magnitud 0..100 respecto al ritmo semanal estipulado (100 = al ritmo previsto o más).
 * En mantenimiento (ritmo previsto ~0): toward = mantenerse dentro del margen de referencia.
 */
export function weighInProgress(p: { change: number; days: number; plannedRatePerWeek: number }): {
  toward: boolean;
  pct: number;
} {
  if (p.days <= 0 || p.change === 0) return { toward: true, pct: 0 };
  const actualRate = p.change / (p.days / 7);
  const ref = Math.abs(p.plannedRatePerWeek) || 0.5;
  const toward = p.plannedRatePerWeek === 0 ? Math.abs(actualRate) <= ref : Math.sign(actualRate) === Math.sign(p.plannedRatePerWeek);
  const pct = Math.max(0, Math.min(100, (Math.abs(actualRate) / ref) * 100));
  return { toward, pct };
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

const LOSE_RATE_PER_WEEK = 0.005; // ~0,5 %/semana del peso corporal
const GAIN_RATE_PER_WEEK = 0.003; // ~0,3 %/semana del peso corporal
const DEFAULT_HORIZON_DAYS = 84; // ~12 semanas (mantenimiento)

function round05(x: number): number {
  return Math.round(x * 2) / 2;
}

/**
 * Sugerencia automática de objetivo (peso + fecha) según la etapa, para el onboarding.
 * Valores orientativos y editables, a ritmos saludables por defecto.
 */
export function suggestGoal(p: {
  initialKg: number;
  stage: string;
  startDate: string;
}): { targetKg: number; targetDate: string } {
  if (p.stage === 'definicion') {
    const targetKg = round05(p.initialKg * 0.92); // perder ~8 %
    return { targetKg, targetDate: estimateTargetDate({ initialKg: p.initialKg, targetKg, startDate: p.startDate }) };
  }
  if (p.stage === 'volumen') {
    const targetKg = round05(p.initialKg * 1.05); // ganar ~5 %
    return { targetKg, targetDate: estimateTargetDate({ initialKg: p.initialKg, targetKg, startDate: p.startDate }) };
  }
  return { targetKg: round05(p.initialKg), targetDate: addDays(p.startDate, DEFAULT_HORIZON_DAYS) };
}

/** Fecha objetivo estimada para un peso, a ritmo saludable (dirección según peso vs inicial). */
export function estimateTargetDate(p: { initialKg: number; targetKg: number; startDate: string }): string {
  const diff = Math.abs(p.targetKg - p.initialKg);
  if (diff < 0.05) return addDays(p.startDate, DEFAULT_HORIZON_DAYS);
  const ratePerWeek = p.initialKg * (p.targetKg < p.initialKg ? LOSE_RATE_PER_WEEK : GAIN_RATE_PER_WEEK);
  const weeks = diff / ratePerWeek;
  return addDays(p.startDate, Math.round(weeks * 7));
}

/** Peso objetivo alcanzable en la fecha dada, a ritmo saludable (dirección según etapa). */
export function estimateTargetWeight(p: {
  initialKg: number;
  startDate: string;
  targetDate: string;
  stage: string;
}): number {
  const weeks = Math.max(0, daysBetween(p.startDate, p.targetDate)) / 7;
  if (p.stage === 'definicion') return round05(p.initialKg - p.initialKg * LOSE_RATE_PER_WEEK * weeks);
  if (p.stage === 'volumen') return round05(p.initialKg + p.initialKg * GAIN_RATE_PER_WEEK * weeks);
  return round05(p.initialKg);
}
