import { estimateOneRepMax, bestOneRepMax, progressionHint, sessionVolume, buildProgress } from './progression';

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

test('sessionVolume suma peso × reps', () => {
  expect(sessionVolume([{ weightKg: 80, reps: 10 }, { weightKg: 80, reps: 8 }])).toBe(80 * 10 + 80 * 8);
  expect(sessionVolume([])).toBe(0);
});

test('buildProgress agrupa por ejercicio y sesión, ignora calentamiento', () => {
  const rows = [
    { exerciseId: 1, name: 'Press banca', sessionId: 10, date: '2026-06-01', weightKg: 40, reps: 5, setType: 'warmup' },
    { exerciseId: 1, name: 'Press banca', sessionId: 10, date: '2026-06-01', weightKg: 80, reps: 10, setType: 'normal' },
    { exerciseId: 1, name: 'Press banca', sessionId: 11, date: '2026-06-08', weightKg: 82.5, reps: 10, setType: 'normal' },
    { exerciseId: 2, name: 'Sentadilla', sessionId: 11, date: '2026-06-08', weightKg: 100, reps: 5, setType: 'normal' },
  ];
  const progress = buildProgress(rows);
  const press = progress.find((p) => p.exerciseId === 1)!;
  expect(press.points).toHaveLength(2);
  expect(press.points[0].volume).toBe(80 * 10); // el calentamiento no suma
  expect(press.points[1].e1rm).toBeCloseTo(estimateOneRepMax(82.5, 10), 1);
  expect(press.bestE1rm).toBeCloseTo(estimateOneRepMax(82.5, 10), 1);
  expect(progress.find((p) => p.exerciseId === 2)!.points).toHaveLength(1);
});
