import { weightInsight } from './insight';

test('objetivo bajar + tendencia baja moderada = perdiendo grasa', () => {
  const r = weightInsight({ slopePerWeek: -0.3, currentTrendKg: 80, goalKg: 74 });
  expect(r.title).toContain('grasa');
});

test('objetivo bajar + bajada muy rápida = aviso de músculo', () => {
  // -1 kg/sem sobre 80 kg = -1,25 %/sem
  const r = weightInsight({ slopePerWeek: -1, currentTrendKg: 80, goalKg: 74 });
  expect(r.title.toLowerCase()).toContain('rápido');
  expect(r.body.toLowerCase()).toContain('músculo');
});

test('objetivo bajar + subida puntual = es agua, no grasa', () => {
  const r = weightInsight({ slopePerWeek: 0.4, currentTrendKg: 80, goalKg: 74 });
  expect(r.body.toLowerCase()).toContain('agua');
});

test('objetivo bajar + plano = estancamiento normal', () => {
  const r = weightInsight({ slopePerWeek: 0, currentTrendKg: 80, goalKg: 74 });
  expect(r.title.toLowerCase()).toContain('estancamiento');
});

test('objetivo subir + tendencia baja = comer más', () => {
  const r = weightInsight({ slopePerWeek: -0.3, currentTrendKg: 70, goalKg: 75 });
  expect(r.body.toLowerCase()).toContain('superávit');
});

test('objetivo alcanzado', () => {
  const r = weightInsight({ slopePerWeek: 0, currentTrendKg: 74, goalKg: 74 });
  expect(r.title.toLowerCase()).toContain('alcanzado');
});

test('sin objetivo + tendencia a la baja', () => {
  const r = weightInsight({ slopePerWeek: -0.3, currentTrendKg: 80, goalKg: null });
  expect(r.title.toLowerCase()).toContain('baja');
});
