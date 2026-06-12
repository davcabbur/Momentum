import { formatKg, formatDelta, friendlyMonth, formatDate, parseDmy } from './format';

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

test('fecha concreta en DD/MM/YYYY', () => {
  expect(formatDate('2026-10-15')).toBe('15/10/2026');
});

test('parseDmy convierte DD/MM/AAAA a ISO', () => {
  expect(parseDmy('15/10/2026')).toBe('2026-10-15');
  expect(parseDmy('5/3/2026')).toBe('2026-03-05');
});

test('parseDmy devuelve null si no es válida', () => {
  expect(parseDmy('32/01/2026')).toBeNull();
  expect(parseDmy('15-10-2026')).toBeNull();
  expect(parseDmy('hola')).toBeNull();
});
