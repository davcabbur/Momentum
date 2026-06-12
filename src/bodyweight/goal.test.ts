import { estimateDaysToGoal, addDays, daysBetween, goalProgressPct, timeElapsedPct, suggestGoal } from './goal';

test('estima días al objetivo cuando se progresa en la dirección correcta', () => {
  // faltan 1 kg, perdiendo 0,25 kg/semana → 28 días
  const days = estimateDaysToGoal({ currentTrendKg: 75, goalKg: 74, slopePerWeek: -0.25 });
  expect(days).toBe(28);
});

test('devuelve null si no se progresa hacia el objetivo', () => {
  // quiere bajar pero la tendencia sube
  expect(estimateDaysToGoal({ currentTrendKg: 75, goalKg: 74, slopePerWeek: 0.2 })).toBeNull();
  // pendiente plana
  expect(estimateDaysToGoal({ currentTrendKg: 75, goalKg: 74, slopePerWeek: 0 })).toBeNull();
});

test('addDays suma días en formato ISO', () => {
  expect(addDays('2026-01-01', 31)).toBe('2026-02-01');
});

test('daysBetween cuenta días entre dos fechas', () => {
  expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7);
});

test('progreso = recorrido / distancia total, acotado 0..100', () => {
  expect(goalProgressPct({ startKg: 80, currentTrendKg: 78, goalKg: 74 })).toBeCloseTo(33.33, 1);
  expect(goalProgressPct({ startKg: 80, currentTrendKg: 81, goalKg: 74 })).toBe(0); // ha ido al revés
  expect(goalProgressPct({ startKg: 80, currentTrendKg: 73, goalKg: 74 })).toBe(100); // pasado
});

test('tiempo transcurrido = días pasados / días totales estimados, acotado 0..100', () => {
  expect(timeElapsedPct({ startDate: '2026-01-01', asOf: '2026-01-08', estimatedTotalDays: 28 })).toBeCloseTo(25, 1);
});

test('suggestGoal en definición propone bajar y una fecha futura', () => {
  const r = suggestGoal({ initialKg: 80, stage: 'definicion', startDate: '2026-01-01' });
  expect(r.targetKg).toBe(73.5); // 80 * 0.92 = 73.6 → 73.5
  expect(r.targetDate > '2026-01-01').toBe(true);
});

test('suggestGoal en volumen propone subir', () => {
  const r = suggestGoal({ initialKg: 80, stage: 'volumen', startDate: '2026-01-01' });
  expect(r.targetKg).toBe(84); // 80 * 1.05
  expect(r.targetDate > '2026-01-01').toBe(true);
});

test('suggestGoal en normocalórica mantiene el peso', () => {
  const r = suggestGoal({ initialKg: 80, stage: 'normocalorica', startDate: '2026-01-01' });
  expect(r.targetKg).toBe(80);
  expect(r.targetDate).toBe(addDays('2026-01-01', 84));
});
