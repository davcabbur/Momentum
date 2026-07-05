import { bestBig3 } from './lifts';

const norm = (name: string, weightKg: number, reps: number) => ({ name, weightKg, reps, setType: 'normal' });

describe('bestBig3', () => {
  it('coge el mejor 1RM estimado por familia', () => {
    const rows = [
      norm('Sentadilla', 100, 5), // e1RM ~116.7
      norm('Sentadilla', 110, 3), // e1RM ~121
      norm('Press banca', 80, 8),
      norm('Peso muerto', 140, 5),
    ];
    const b = bestBig3(rows);
    expect(b.squat).toBeGreaterThan(120);
    expect(b.bench).toBeGreaterThan(80);
    expect(b.dead).toBeGreaterThan(140);
  });

  it('ignora calentamientos y series de más de 12 reps', () => {
    const rows = [
      { name: 'Press banca', weightKg: 200, reps: 1, setType: 'warmup' }, // calentamiento (ignorar)
      { name: 'Press banca', weightKg: 60, reps: 20, setType: 'normal' }, // >12 reps (ignorar)
      norm('Press banca', 90, 5),
    ];
    const b = bestBig3(rows);
    expect(b.bench).toBeGreaterThan(90);
    expect(b.bench).toBeLessThan(120); // no contó los 200 kg del calentamiento
  });

  it('lifts sin registrar quedan a 0', () => {
    expect(bestBig3([norm('Press banca', 90, 5)])).toMatchObject({ squat: 0, dead: 0 });
  });
});
