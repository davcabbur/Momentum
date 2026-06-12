import { weightInsight } from './insight';

const MANY = 10; // pesajes suficientes para tener tendencia

test('objetivo bajar + tendencia baja moderada = perdiendo grasa', () => {
  const r = weightInsight({ slopePerWeek: -0.3, currentTrendKg: 80, goalKg: 74, pointCount: MANY });
  expect(r.title).toContain('grasa');
});

test('objetivo bajar + bajada muy rápida = aviso de músculo', () => {
  const r = weightInsight({ slopePerWeek: -1, currentTrendKg: 80, goalKg: 74, pointCount: MANY });
  expect(r.title.toLowerCase()).toContain('rápido');
  expect(r.body.toLowerCase()).toContain('músculo');
});

test('objetivo bajar + subida puntual = es agua, no grasa', () => {
  const r = weightInsight({ slopePerWeek: 0.4, currentTrendKg: 80, goalKg: 74, pointCount: MANY });
  expect(r.body.toLowerCase()).toContain('agua');
});

test('objetivo bajar + plano = estancamiento normal', () => {
  const r = weightInsight({ slopePerWeek: 0, currentTrendKg: 80, goalKg: 74, pointCount: MANY });
  expect(r.title.toLowerCase()).toContain('estancamiento');
});

test('objetivo subir + tendencia baja = comer más', () => {
  const r = weightInsight({ slopePerWeek: -0.3, currentTrendKg: 70, goalKg: 75, pointCount: MANY });
  expect(r.body.toLowerCase()).toContain('superávit');
});

test('objetivo alcanzado', () => {
  const r = weightInsight({ slopePerWeek: 0, currentTrendKg: 74, goalKg: 74, pointCount: MANY });
  expect(r.title.toLowerCase()).toContain('alcanzado');
});

test('sin objetivo + tendencia a la baja', () => {
  const r = weightInsight({ slopePerWeek: -0.3, currentTrendKg: 80, goalKg: null, pointCount: MANY });
  expect(r.title.toLowerCase()).toContain('baja');
});

test('un solo pesaje (inicial) = mensaje de arranque, no de tendencia', () => {
  const r = weightInsight({ slopePerWeek: 0, currentTrendKg: 80, goalKg: 74, pointCount: 1 });
  expect(r.title.toLowerCase()).toContain('inicial');
  expect(r.title.toLowerCase()).not.toContain('estancamiento');
});

test('pocos pesajes = vas cogiendo datos', () => {
  const r = weightInsight({ slopePerWeek: 0.5, currentTrendKg: 80, goalKg: 74, pointCount: 2 });
  expect(r.title.toLowerCase()).toContain('datos');
});
