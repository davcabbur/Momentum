import { estimateRealTdee } from './tdee-estimate';

test('peso estable → TDEE ≈ ingesta media', () => {
  expect(estimateRealTdee({ avgIntakeKcal: 2500, weightChangeKg: 0, spanDays: 14, loggedDays: 14 })).toBe(2500);
});

test('bajaste comiendo 2000 → tu gasto real es mayor', () => {
  // -1 kg en 14 días = -550 kcal/día de balance → TDEE = 2000 + 550 = 2550
  expect(estimateRealTdee({ avgIntakeKcal: 2000, weightChangeKg: -1, spanDays: 14, loggedDays: 14 })).toBe(2550);
});

test('subiste comiendo 3000 → tu gasto real es menor', () => {
  expect(estimateRealTdee({ avgIntakeKcal: 3000, weightChangeKg: 1, spanDays: 14, loggedDays: 14 })).toBe(2450);
});

test('pocos días registrados → null', () => {
  expect(estimateRealTdee({ avgIntakeKcal: 2500, weightChangeKg: 0, spanDays: 14, loggedDays: 4 })).toBeNull();
});
