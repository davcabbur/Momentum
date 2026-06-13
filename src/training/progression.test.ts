import { estimateOneRepMax, bestOneRepMax, progressionHint } from './progression';

test('1RM estimado (Epley)', () => {
  expect(estimateOneRepMax(100, 1)).toBe(100);
  expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.3, 1);
});

test('bestOneRepMax toma la mejor serie', () => {
  const sets = [
    { weightKg: 80, reps: 8 },
    { weightKg: 100, reps: 5 },
  ];
  expect(bestOneRepMax(sets)).toBeCloseTo(estimateOneRepMax(100, 5), 1);
});

const SCHEME = { sets: 3, repMin: 8, repMax: 12 };

test('doble progresión: todas las series al tope → subir peso', () => {
  const last = [
    { weightKg: 80, reps: 12 },
    { weightKg: 80, reps: 12 },
    { weightKg: 80, reps: 12 },
  ];
  const h = progressionHint(last, SCHEME);
  expect(h.ready).toBe(true);
  expect(h.suggestedWeightKg).toBe(82.5);
});

test('no todas al tope → seguir con el mismo peso', () => {
  const last = [
    { weightKg: 80, reps: 12 },
    { weightKg: 80, reps: 10 },
    { weightKg: 80, reps: 9 },
  ];
  expect(progressionHint(last, SCHEME).ready).toBe(false);
});

test('sin datos → mensaje neutro', () => {
  expect(progressionHint([], SCHEME).ready).toBe(false);
});
