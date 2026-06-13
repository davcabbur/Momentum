import { parseOffProduct } from './openfoodfacts';

test('parseOffProduct: extrae nombre y macros por 100 g', () => {
  const json = {
    status: 1,
    product: {
      product_name: 'Avena',
      nutriments: { 'energy-kcal_100g': 389, proteins_100g: 16.9, carbohydrates_100g: 66.3, fat_100g: 6.9 },
    },
  };
  const r = parseOffProduct(json)!;
  expect(r.name).toBe('Avena');
  expect(r.per100).toEqual({ kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9 });
});

test('parseOffProduct: producto no encontrado → null', () => {
  expect(parseOffProduct({ status: 0 })).toBeNull();
});

test('parseOffProduct: sin kcal → null', () => {
  expect(parseOffProduct({ status: 1, product: { product_name: 'X', nutriments: {} } })).toBeNull();
});
