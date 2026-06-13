import { macroTargets, portionMacros, sumMacros } from './macros';

test('macroTargets: proteína por etapa, grasa ~27%, carbos el resto', () => {
  // 2000 kcal, 80 kg, definición → proteína 80*2.2=176 g
  const m = macroTargets(2000, 80, 'definicion');
  expect(m.kcal).toBe(2000);
  expect(m.protein).toBe(176);
  expect(m.fat).toBe(Math.round((2000 * 0.27) / 9)); // 60
  // carbos = (2000 - 176*4 - 60*9)/4 = (2000-704-540)/4 = 189
  expect(m.carbs).toBe(189);
});

test('portionMacros escala por gramos', () => {
  const per100 = { kcal: 200, protein: 10, carbs: 30, fat: 5 };
  const p = portionMacros(per100, 150);
  expect(p.kcal).toBe(300);
  expect(p.protein).toBe(15);
});

test('sumMacros suma varias raciones', () => {
  const total = sumMacros([
    { kcal: 300, protein: 15, carbs: 45, fat: 7.5 },
    { kcal: 200, protein: 20, carbs: 10, fat: 5 },
  ]);
  expect(total.kcal).toBe(500);
  expect(total.protein).toBe(35);
});
