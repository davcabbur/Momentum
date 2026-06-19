import { defaultScheme } from './default-scheme';

test('compuesto pesado (barra): 4×6–8 en intermedio', () => {
  expect(defaultScheme('Sentadilla', 'intermedio')).toEqual({ sets: 4, repMin: 6, repMax: 8 });
});

test('compuesto pesado en principiante: 3 series y reps más altas', () => {
  expect(defaultScheme('Press banca', 'principiante')).toEqual({ sets: 3, repMin: 8, repMax: 12 });
});

test('compuesto de hipertrofia (máquina/mancuerna): 4×8–12', () => {
  expect(defaultScheme('Press de pecho en máquina', 'intermedio')).toEqual({ sets: 4, repMin: 8, repMax: 12 });
  expect(defaultScheme('Hack squat', 'avanzado')).toEqual({ sets: 4, repMin: 8, repMax: 12 });
});

test('aislamiento: 3 series y más reps', () => {
  expect(defaultScheme('Curl bíceps', 'avanzado')).toEqual({ sets: 3, repMin: 10, repMax: 15 });
});

test('desconocido/custom: esquema genérico', () => {
  expect(defaultScheme('Mi ejercicio raro', 'intermedio')).toEqual({ sets: 3, repMin: 8, repMax: 12 });
});

test('reps altas: antebrazo, gemelo, core y abducción', () => {
  expect(defaultScheme('Curl de muñeca', 'intermedio')).toEqual({ sets: 3, repMin: 12, repMax: 20 });
  expect(defaultScheme('Gemelo de pie', 'avanzado')).toEqual({ sets: 3, repMin: 12, repMax: 20 });
  expect(defaultScheme('Abducción de cadera', 'principiante')).toEqual({ sets: 3, repMin: 12, repMax: 20 });
});
