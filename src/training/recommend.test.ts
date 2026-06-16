import { recommendForMuscle, recommendCount } from './recommend';

const PECHO = [
  { name: 'Press inclinado', muscleGroup: 'pecho' },
  { name: 'Press banca', muscleGroup: 'pecho' },
  { name: 'Press plano mancuerna', muscleGroup: 'pecho' },
  { name: 'Aperturas', muscleGroup: 'pecho' },
  { name: 'Fondos', muscleGroup: 'pecho' },
  { name: 'Cruces en polea', muscleGroup: 'pecho' },
  { name: 'Press declinado', muscleGroup: 'pecho' },
  { name: 'Curl bíceps', muscleGroup: 'biceps' }, // ruido: otro músculo
];

test('recommendCount: grandes 4, pequeños 3', () => {
  expect(recommendCount('pecho')).toBe(4);
  expect(recommendCount('biceps')).toBe(3);
});

test('recomienda compuestos primero y cubre regiones', () => {
  const r = recommendForMuscle(PECHO, 'pecho', { scope: 'gym' });
  expect(r).toHaveLength(4);
  // El primero es un compuesto, no el aislamiento.
  expect(['Press inclinado', 'Press banca', 'Press plano mancuerna', 'Fondos', 'Press declinado']).toContain(r[0]);
  // Cubre el aislamiento de estiramiento (aperturas/cruces) por cobertura de regiones.
  expect(r.some((n) => n === 'Aperturas' || n === 'Cruces en polea')).toBe(true);
  // No mete ejercicios de otro músculo.
  expect(r).not.toContain('Curl bíceps');
});

test('filtra por material: peso corporal solo deja Fondos en pecho', () => {
  expect(recommendForMuscle(PECHO, 'pecho', { scope: 'bodyweight' })).toEqual(['Fondos']);
});
