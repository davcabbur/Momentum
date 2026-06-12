import { computeTrend, trendSlopePerWeek } from './trend';

test('el primer punto de tendencia es igual al primer pesaje', () => {
  const out = computeTrend([{ date: '2026-01-01', weightKg: 80 }]);
  expect(out[0].trendKg).toBeCloseTo(80, 5);
});

test('la tendencia suaviza el ruido diario (EWMA alpha=0.1)', () => {
  const out = computeTrend(
    [
      { date: '2026-01-01', weightKg: 80 },
      { date: '2026-01-02', weightKg: 82 }, // ruido al alza
    ],
    0.1,
  );
  // 80 + 0.1*(82-80) = 80.2
  expect(out[1].trendKg).toBeCloseTo(80.2, 5);
});

test('ordena por fecha aunque entren desordenados', () => {
  const out = computeTrend([
    { date: '2026-01-02', weightKg: 82 },
    { date: '2026-01-01', weightKg: 80 },
  ]);
  expect(out[0].date).toBe('2026-01-01');
  expect(out[1].date).toBe('2026-01-02');
});

test('pendiente negativa cuando la tendencia baja ~0,25 kg/semana', () => {
  // 15 días perdiendo 0,25 kg/semana ≈ 0,0357 kg/día
  const entries = Array.from({ length: 15 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    weightKg: 80 - i * (0.25 / 7),
  }));
  const trend = computeTrend(entries, 1); // alpha=1 → tendencia = pesaje, para test determinista
  const slope = trendSlopePerWeek(trend, 14);
  expect(slope).toBeCloseTo(-0.25, 1);
});

test('pendiente 0 con un solo punto', () => {
  const trend = computeTrend([{ date: '2026-01-01', weightKg: 80 }]);
  expect(trendSlopePerWeek(trend, 14)).toBe(0);
});
