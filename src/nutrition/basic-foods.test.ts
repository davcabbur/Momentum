import { BASIC_FOODS, searchBasicFoods } from './basic-foods';

test('el catálogo tiene una buena base de alimentos con valores válidos', () => {
  expect(BASIC_FOODS.length).toBeGreaterThan(50);
  for (const f of BASIC_FOODS) {
    expect(f.name.length).toBeGreaterThan(0);
    expect(f.per100.kcal).toBeGreaterThanOrEqual(0);
    expect(f.per100.protein).toBeGreaterThanOrEqual(0);
  }
});

test('busca por nombre', () => {
  const r = searchBasicFoods('pollo');
  expect(r.some((f) => f.name === 'Pechuga de pollo')).toBe(true);
});

test('la búsqueda ignora las tildes', () => {
  expect(searchBasicFoods('platano').some((f) => f.name === 'Plátano')).toBe(true);
  expect(searchBasicFoods('PLÁTANO').some((f) => f.name === 'Plátano')).toBe(true);
});

test('prioriza los que empiezan por la query', () => {
  const r = searchBasicFoods('pan');
  expect(r[0].name.toLowerCase().startsWith('pan')).toBe(true);
});

test('query vacía no devuelve nada', () => {
  expect(searchBasicFoods('')).toEqual([]);
});
