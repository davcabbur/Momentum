import { big3Dots, dots, isPlausibleDots, tierForDots } from './score';

describe('dots', () => {
  it('0 sin datos', () => {
    expect(dots(0, 90, 'male')).toBe(0);
    expect(dots(500, 0, 'male')).toBe(0);
  });

  it('valor de referencia (hombre 93 kg, total 500) ≈ 318', () => {
    expect(dots(500, 93, 'male')).toBeCloseTo(318, 0);
  });

  it('a igual total, más peso corporal = menos DOTS', () => {
    expect(dots(500, 80, 'male')).toBeGreaterThan(dots(500, 110, 'male'));
  });

  it('a igual total y peso, la mujer puntúa más alto que el hombre', () => {
    expect(dots(300, 70, 'female')).toBeGreaterThan(dots(300, 70, 'male'));
  });
});

describe('big3Dots', () => {
  it('incompleto (falta un lift) → 0', () => {
    expect(big3Dots({ squat: 100, bench: 0, dead: 120, bodyweightKg: 80, sex: 'male' })).toBe(0);
  });

  it('completo → DOTS del total', () => {
    expect(big3Dots({ squat: 180, bench: 120, dead: 200, bodyweightKg: 93, sex: 'male' })).toBeCloseTo(dots(500, 93, 'male'), 1);
  });
});

describe('tierForDots', () => {
  it('mapea los umbrales', () => {
    expect(tierForDots(0).key).toBe('hierro');
    expect(tierForDots(210).key).toBe('plata');
    expect(tierForDots(320).key).toBe('platino');
    expect(tierForDots(520).key).toBe('challenger');
  });
});

describe('isPlausibleDots', () => {
  it('rechaza 0 y valores absurdos', () => {
    expect(isPlausibleDots(0)).toBe(false);
    expect(isPlausibleDots(350)).toBe(true);
    expect(isPlausibleDots(900)).toBe(false);
  });
});
