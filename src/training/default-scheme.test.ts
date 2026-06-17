import { defaultScheme } from './default-scheme';

test('compuesto: menos reps, 4 series en intermedio', () => {
  expect(defaultScheme('Sentadilla', 'intermedio')).toEqual({ sets: 4, repMin: 6, repMax: 10 });
});

test('compuesto en principiante: 3 series y reps algo más altas', () => {
  expect(defaultScheme('Press banca', 'principiante')).toEqual({ sets: 3, repMin: 8, repMax: 12 });
});

test('aislamiento: 3 series y más reps', () => {
  expect(defaultScheme('Curl bíceps', 'avanzado')).toEqual({ sets: 3, repMin: 10, repMax: 15 });
});

test('desconocido/custom: esquema genérico', () => {
  expect(defaultScheme('Mi ejercicio raro', 'intermedio')).toEqual({ sets: 3, repMin: 8, repMax: 12 });
});

test('muñeca/antebrazo: reps altas', () => {
  expect(defaultScheme('Curl de muñeca', 'intermedio')).toEqual({ sets: 3, repMin: 12, repMax: 20 });
  expect(defaultScheme('Curl inverso', 'principiante')).toEqual({ sets: 3, repMin: 12, repMax: 20 });
});
