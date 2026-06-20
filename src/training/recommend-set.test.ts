import { defaultSetKind, recommendSet } from './recommend-set';

const scheme = { sets: 4, repMin: 8, repMax: 12 };

test('compuesto: 1ª serie = top set, reps en la parte baja, peso = objetivo', () => {
  expect(recommendSet({ setNumber: 1, isCompound: true, scheme, topSetWeightKg: 100, lastSameWeightKg: 95 })).toEqual({
    setType: 'top',
    weightKg: 100,
    repMin: 8,
    repMax: 10,
  });
});

test('compuesto: back-off ~10% por debajo del top set y reps altas', () => {
  expect(recommendSet({ setNumber: 2, isCompound: true, scheme, topSetWeightKg: 100, lastSameWeightKg: 90 })).toEqual({
    setType: 'backoff',
    weightKg: 90,
    repMin: 10,
    repMax: 12,
  });
});

test('back-off redondea a placa de 2,5 kg', () => {
  // 60 * 0,9 = 54 -> 55
  expect(recommendSet({ setNumber: 2, isCompound: true, scheme, topSetWeightKg: 60, lastSameWeightKg: null }).weightKg).toBe(55);
});

test('aislamiento: serie normal, rango completo', () => {
  const iso = { sets: 3, repMin: 10, repMax: 15 };
  expect(recommendSet({ setNumber: 1, isCompound: false, scheme: iso, topSetWeightKg: 20, lastSameWeightKg: 18 })).toEqual({
    setType: 'normal',
    weightKg: 20,
    repMin: 10,
    repMax: 15,
  });
});

test('sin objetivo de top set, usa el peso de la última vez', () => {
  expect(recommendSet({ setNumber: 2, isCompound: true, scheme, topSetWeightKg: null, lastSameWeightKg: 80 }).weightKg).toBe(80);
});

test('dominadas/fondos (peso corporal): el back-off no se reduce', () => {
  const r = recommendSet({ setNumber: 2, isCompound: true, scheme, topSetWeightKg: 90, lastSameWeightKg: 90, bodyweightLoaded: true });
  expect(r.weightKg).toBe(90);
});

test('defaultSetKind: compuesto 1ª top, resto back-off; aislamiento normal', () => {
  expect(defaultSetKind(1, true)).toBe('top');
  expect(defaultSetKind(3, true)).toBe('backoff');
  expect(defaultSetKind(1, false)).toBe('normal');
});
