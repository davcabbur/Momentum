import { recommendedRestSeconds } from './rest';

test('descanso por rango de reps', () => {
  expect(recommendedRestSeconds(6)).toBe(180);
  expect(recommendedRestSeconds(10)).toBe(120);
  expect(recommendedRestSeconds(15)).toBe(90);
});
