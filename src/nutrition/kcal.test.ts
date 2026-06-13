import { bmrMifflin, tdee, kcalForTarget, proteinTarget, liveKcalPlan } from './kcal';

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

test('proteinTarget: proteína alta, algo más en déficit', () => {
  expect(proteinTarget(80, 'definicion')).toBe(176); // 80*2.2
  expect(proteinTarget(80, 'normocalorica')).toBe(160); // 80*2.0
  expect(proteinTarget(80, 'volumen')).toBe(144); // 80*1.8
});

const BASE = { sex: 'male', age: 30, heightCm: 180, activityLevel: 'moderate', trendKg: 80, targetKg: 74 };

test('liveKcalPlan: objetivo estático coincide con kcalForTarget', () => {
  // 84 días, mismo caso → mismo objetivo (tdee 2759, déficit -550 → 2209)
  const plan = liveKcalPlan({ ...BASE, daysRemaining: 84, actualRatePerWeek: null });
  expect(plan.tdee).toBe(2759);
  expect(plan.targetKcal).toBe(2209);
  expect(plan.track).toBe('sin-datos');
  expect(plan.adjustedKcal).toBeNull();
});

test('liveKcalPlan: en camino cuando el ritmo real ≈ el previsto', () => {
  // plannedRate = (74-80)/12 = -0.5 kg/sem
  const plan = liveKcalPlan({ ...BASE, daysRemaining: 84, actualRatePerWeek: -0.5 });
  expect(plan.track).toBe('en-camino');
  expect(plan.adjustedKcal).toBe(plan.targetKcal);
});

test('liveKcalPlan: bajando más lento → comer menos (lento)', () => {
  const plan = liveKcalPlan({ ...BASE, daysRemaining: 84, actualRatePerWeek: -0.2 });
  expect(plan.track).toBe('lento');
  expect(plan.adjustedKcal).toBeLessThan(plan.targetKcal);
});

test('liveKcalPlan: bajando más rápido → comer más (rápido)', () => {
  const plan = liveKcalPlan({ ...BASE, daysRemaining: 84, actualRatePerWeek: -0.8 });
  expect(plan.track).toBe('rapido');
  expect(plan.adjustedKcal).toBeGreaterThan(plan.targetKcal);
});
