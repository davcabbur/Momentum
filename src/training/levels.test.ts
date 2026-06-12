import { schemeForLevel, describeScheme } from './levels';

test('principiante: 3 series 8-12 RIR 2-3', () => {
  expect(schemeForLevel('principiante')).toEqual({ sets: 3, repMin: 8, repMax: 12, rirMin: 2, rirMax: 3 });
});

test('avanzado tiene >= series y <= RIR que principiante', () => {
  const a = schemeForLevel('avanzado');
  const p = schemeForLevel('principiante');
  expect(a.sets).toBeGreaterThanOrEqual(p.sets);
  expect(a.rirMin).toBeLessThanOrEqual(p.rirMin);
});

test('describeScheme da el texto del objetivo', () => {
  expect(describeScheme(schemeForLevel('principiante'))).toBe('3×8–12 · RIR 2–3');
});
