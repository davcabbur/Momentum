import { nextDay } from './next-day';

const DAYS = [
  { id: 10, name: 'Empuje' },
  { id: 11, name: 'Tirón' },
  { id: 12, name: 'Pierna' },
];

test('sin entrenos previos → primer día', () => {
  expect(nextDay(DAYS, null)?.name).toBe('Empuje');
});

test('tras el último entrenado → el siguiente', () => {
  expect(nextDay(DAYS, 10)?.name).toBe('Tirón');
  expect(nextDay(DAYS, 11)?.name).toBe('Pierna');
});

test('tras el último día → vuelve al primero (cíclico)', () => {
  expect(nextDay(DAYS, 12)?.name).toBe('Empuje');
});

test('día desconocido o sin días', () => {
  expect(nextDay(DAYS, 999)?.name).toBe('Empuje');
  expect(nextDay([], null)).toBeNull();
});
