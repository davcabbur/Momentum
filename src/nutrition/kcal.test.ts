import { bmrMifflin, tdee, kcalForTarget } from './kcal';

test('BMR Mifflin-St Jeor hombre', () => {
  // 10*80 + 6.25*180 - 5*30 + 5 = 1780
  expect(bmrMifflin({ sex: 'male', age: 30, heightCm: 180, weightKg: 80 })).toBe(1780);
});

test('BMR Mifflin-St Jeor mujer (−161)', () => {
  // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
  expect(bmrMifflin({ sex: 'female', age: 30, heightCm: 165, weightKg: 65 })).toBeCloseTo(1370.25, 2);
});

test('TDEE aplica el factor de actividad', () => {
  // 1780 * 1.55 = 2759
  expect(tdee({ sex: 'male', age: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate' })).toBeCloseTo(2759, 0);
});

test('kcalForTarget: perder 6 kg en 84 días desde 80 kg (hombre, moderado)', () => {
  const plan = kcalForTarget({
    sex: 'male',
    age: 30,
    heightCm: 180,
    activityLevel: 'moderate',
    currentKg: 80,
    targetKg: 74,
    startDate: '2026-01-01',
    targetDate: '2026-03-26', // 84 días
  });
  // déficit diario = (74-80)*7700/84 = -550 ; tdee 2759 → 2209
  expect(plan.tdee).toBe(2759);
  expect(plan.dailyDeltaKcal).toBe(-550);
  expect(plan.kcal).toBe(2209);
});
