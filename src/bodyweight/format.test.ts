import { formatKg, formatDelta, friendlyMonth } from './format';

test('peso con una decimal y coma', () => {
  expect(formatKg(78.42)).toBe('78,4 kg');
});

test('delta con signo y flecha', () => {
  expect(formatDelta(-0.5)).toBe('▼ 0,5 kg');
  expect(formatDelta(0.3)).toBe('▲ 0,3 kg');
  expect(formatDelta(0)).toBe('— 0,0 kg');
});

test('mes natural en español', () => {
  expect(friendlyMonth('2026-10-15')).toBe('mediados de octubre');
  expect(friendlyMonth('2026-10-03')).toBe('principios de octubre');
  expect(friendlyMonth('2026-10-27')).toBe('finales de octubre');
});
