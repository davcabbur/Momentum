import { parseOffProduct, parseOffSearch } from './openfoodfacts';

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

test('parseOffSearch: lista de productos, filtra sin kcal/nombre y deduplica', () => {
  const json = {
    products: [
      { product_name: 'Avena', nutriments: { 'energy-kcal_100g': 389, proteins_100g: 16.9, carbohydrates_100g: 66.3, fat_100g: 6.9 } },
      { product_name: 'Sin datos', nutriments: {} }, // se filtra (sin kcal)
      { product_name: '', nutriments: { 'energy-kcal_100g': 100 } }, // se filtra (sin nombre)
      { product_name: 'Avena', nutriments: { 'energy-kcal_100g': 380 } }, // duplicado por nombre
    ],
  };
  const r = parseOffSearch(json);
  expect(r).toHaveLength(1);
  expect(r[0].name).toBe('Avena');
});
