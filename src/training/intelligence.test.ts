import { detectStall, deloadAdvice, welcomeBackAdvice } from './intelligence';

test('detectStall: pocos datos → no concluye', () => {
  expect(detectStall([100, 105]).enoughData).toBe(false);
});

test('detectStall: progresando → no estancado', () => {
  const s = detectStall([100, 105, 110, 115]);
  expect(s.enoughData).toBe(true);
  expect(s.sessionsSincePR).toBe(0);
  expect(s.stalled).toBe(false);
});

test('detectStall: misma marca varias sesiones → estancado', () => {
  const s = detectStall([100, 110, 110, 110, 110]);
  expect(s.sessionsSincePR).toBe(3);
  expect(s.stalled).toBe(true);
});

test('detectStall: justo en el umbral (window=3)', () => {
  expect(detectStall([100, 108, 108, 108]).stalled).toBe(false); // 2 sin PR
  expect(detectStall([100, 108, 108, 108, 108]).stalled).toBe(true); // 3 sin PR
});

test('deloadAdvice: solo aconseja si estancado', () => {
  expect(deloadAdvice('Press banca', detectStall([100, 105, 110, 115]))).toBeNull();
  const advice = deloadAdvice('Press banca', detectStall([100, 110, 110, 110, 110]));
  expect(advice?.kind).toBe('deload');
  expect(advice?.text).toContain('Press banca');
});

test('welcomeBackAdvice: solo tras un parón', () => {
  expect(welcomeBackAdvice(3)).toBeNull();
  expect(welcomeBackAdvice(14)?.kind).toBe('welcome-back');
});
