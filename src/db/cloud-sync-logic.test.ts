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
