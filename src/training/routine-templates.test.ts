import { routineTemplatesFor, exercisesForType } from './routine-templates';

test('3 días ofrece PPL', () => {
  const t = routineTemplatesFor(3);
  expect(t.some((x) => x.name.includes('PPL'))).toBe(true);
});

test('cada plantilla tiene tantos días como días/semana', () => {
  for (const n of [2, 3, 4, 5, 6]) {
    for (const t of routineTemplatesFor(n)) {
      expect(t.days.length).toBe(n);
    }
  }
});

test('un número sin plantillas devuelve vacío', () => {
  expect(routineTemplatesFor(1)).toEqual([]);
});

test('cada día de plantilla tiene un tipo con ejercicios por defecto', () => {
  const ppl = routineTemplatesFor(3).find((t) => t.key === 'ppl')!;
  for (const d of ppl.days) {
    expect(exercisesForType(d.type).length).toBeGreaterThan(0);
  }
});
