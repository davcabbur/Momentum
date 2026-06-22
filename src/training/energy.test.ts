import { estimateWorkoutKcal } from './energy';

describe('estimateWorkoutKcal', () => {
  it('devuelve 0 si no hay series de trabajo', () => {
    expect(estimateWorkoutKcal({ workingSets: 0, bodyweightKg: 80 })).toBe(0);
  });

  it('devuelve 0 si no hay peso corporal', () => {
    expect(estimateWorkoutKcal({ workingSets: 20, bodyweightKg: 0 })).toBe(0);
  });

  it('estima ~420 kcal para 20 series a 80 kg', () => {
    // 20 series × 3 min = 60 min; kcal/min = 5 × 3,5 × 80 / 200 = 7 → 420
    expect(estimateWorkoutKcal({ workingSets: 20, bodyweightKg: 80 })).toBe(420);
  });

  it('escala con las series y el peso', () => {
    const pocas = estimateWorkoutKcal({ workingSets: 10, bodyweightKg: 80 });
    const muchas = estimateWorkoutKcal({ workingSets: 20, bodyweightKg: 80 });
    expect(muchas).toBeGreaterThan(pocas);
    const ligero = estimateWorkoutKcal({ workingSets: 15, bodyweightKg: 60 });
    const pesado = estimateWorkoutKcal({ workingSets: 15, bodyweightKg: 90 });
    expect(pesado).toBeGreaterThan(ligero);
  });
});
