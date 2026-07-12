import { reconcileDecision } from './cloud-sync-logic';

test('nube vacía + local con datos -> push', () => {
  expect(reconcileDecision({ localHasData: true, remoteExists: false })).toBe('push');
});
test('nube con datos + local vacío -> pull', () => {
  expect(reconcileDecision({ localHasData: false, remoteExists: true })).toBe('pull');
});
test('ambos con datos -> ask', () => {
  expect(reconcileDecision({ localHasData: true, remoteExists: true })).toBe('ask');
});
test('ambos vacíos -> none', () => {
  expect(reconcileDecision({ localHasData: false, remoteExists: false })).toBe('none');
});

// Datos locales de OTRA cuenta (fuga entre cuentas en el mismo móvil):
// nunca se adoptan ni se suben; se reemplazan por los de la nube o se empieza de cero.
test('local de otra cuenta + nube con datos -> replace (borrar local y bajar nube)', () => {
  expect(reconcileDecision({ localHasData: true, remoteExists: true, foreignOwner: true })).toBe('replace');
});
test('local de otra cuenta + nube vacía -> reset (borrar local, empezar de cero)', () => {
  expect(reconcileDecision({ localHasData: true, remoteExists: false, foreignOwner: true })).toBe('reset');
});
test('local vacío: el propietario ajeno es irrelevante -> pull/none normales', () => {
  expect(reconcileDecision({ localHasData: false, remoteExists: true, foreignOwner: true })).toBe('pull');
  expect(reconcileDecision({ localHasData: false, remoteExists: false, foreignOwner: true })).toBe('none');
});
test('mismo propietario: comportamiento de siempre', () => {
  expect(reconcileDecision({ localHasData: true, remoteExists: true, foreignOwner: false })).toBe('ask');
  expect(reconcileDecision({ localHasData: true, remoteExists: false, foreignOwner: false })).toBe('push');
});
