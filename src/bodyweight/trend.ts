export interface WeightPoint {
  /** Fecha del pesaje en formato YYYY-MM-DD. */
  date: string;
  weightKg: number;
}

export interface TrendPoint extends WeightPoint {
  /** Peso suavizado: la tendencia, no el dato del día. */
  trendKg: number;
}

/**
 * Media móvil exponencial (EWMA) sobre los pesajes diarios.
 * Ignora el ruido del día a día (agua, glucógeno…) y resalta la dirección real.
 * `alpha` alto = sigue más al dato del día; `alpha` bajo = más suave.
 */
export function computeTrend(entries: WeightPoint[], alpha = 0.1): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let trend: number | null = null;
  return sorted.map((e) => {
    trend = trend === null ? e.weightKg : trend + alpha * (e.weightKg - trend);
    return { ...e, trendKg: trend };
  });
}

const MS_PER_DAY = 86_400_000;

function dayNumber(isoDate: string): number {
  return Math.round(new Date(isoDate + 'T00:00:00Z').getTime() / MS_PER_DAY);
}

/**
 * Pendiente de la tendencia en kg/semana, por mínimos cuadrados sobre los
 * últimos `windowDays` días. Negativa = bajando, positiva = subiendo.
 */
export function trendSlopePerWeek(trend: TrendPoint[], windowDays = 14): number {
  if (trend.length < 2) return 0;
  const lastDay = dayNumber(trend[trend.length - 1].date);
  const window = trend.filter((p) => lastDay - dayNumber(p.date) <= windowDays);
  if (window.length < 2) return 0;

  const xs = window.map((p) => dayNumber(p.date));
  const ys = window.map((p) => p.trendKg);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slopePerDay = den === 0 ? 0 : num / den;
  return slopePerDay * 7;
}
