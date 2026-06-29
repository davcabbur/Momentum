import { defaultSetKind, progressiveWeight, recommendSet } from './recommend-set';

const scheme = { sets: 4, repMin: 8, repMax: 12 };

describe('progressiveWeight (doble progresión guiada por RIR, estándar)', () => {
  it('llegó al tope de reps con RIR de sobra → salto doble', () => {
    // objetivo RIR 1, hizo RIR 3 (sobran 2) → +2 escalones (2×2,5)
    expect(progressiveWeight({ weightKg: 100, reps: 12, rir: 3 }, scheme, 1)).toBe(105);
  });

  it('llegó al tope de reps con RIR justo → +1 escalón', () => {
    expect(progressiveWeight({ weightKg: 100, reps: 12, rir: 1 }, scheme, 1)).toBe(102.5);
  });

  it('dentro del rango → mismo peso (subes reps antes que peso)', () => {
    expect(progressiveWeight({ weightKg: 100, reps: 10, rir: 2 }, scheme, 1)).toBe(100);
  });

  it('por debajo del rango → mismo peso (consolidar)', () => {
    expect(progressiveWeight({ weightKg: 100, reps: 6, rir: 0 }, scheme, 1)).toBe(100);
  });

  it('pesos bajos suben de 1 en 1 (doble = 2)', () => {
    expect(progressiveWeight({ weightKg: 10, reps: 12, rir: 4 }, scheme, 1)).toBe(12);
  });
});

describe('recommendSet', () => {
  it('compuesto 1ª serie = top set; progresa desde la última sesión', () => {
    // última top 100×12 RIR 3 (sobra) → 105; top set reps en parte baja
    expect(
      recommendSet({
        setNumber: 1,
        isCompound: true,
        scheme,
        targetRir: 1,
        todayTopWeightKg: null,
        lastWorkTop: { weightKg: 100, reps: 12, rir: 3 },
      }),
    ).toEqual({ setType: 'top', weightKg: 105, repMin: 8, repMax: 10 });
  });

  it('back-off SIEMPRE más ligero que el top de hoy (no lo pisa)', () => {
    // el bug: top set 80 hoy → back-off debe ser ~72 (80×0,9=72 → placa 72,5), no 80
    expect(
      recommendSet({
        setNumber: 2,
        isCompound: true,
        scheme,
        targetRir: 1,
        todayTopWeightKg: 80,
        lastWorkTop: null,
      }),
    ).toEqual({ setType: 'backoff', weightKg: 72.5, repMin: 10, repMax: 12 });
  });

  it('back-off redondea a placa de 2,5 kg', () => {
    // 60 * 0,9 = 54 -> 55
    expect(
      recommendSet({ setNumber: 2, isCompound: true, scheme, targetRir: 1, todayTopWeightKg: 60, lastWorkTop: null }).weightKg,
    ).toBe(55);
  });

  it('lo ya hecho hoy manda sobre la progresión (no subir a media sesión)', () => {
    // hoy ya hay 100; aunque la última vez tocara subir, la serie normal usa 100
    expect(
      recommendSet({
        setNumber: 2,
        isCompound: false,
        scheme: { sets: 3, repMin: 10, repMax: 15 },
        targetRir: 1,
        todayTopWeightKg: 100,
        lastWorkTop: { weightKg: 90, reps: 15, rir: 3 },
      }),
    ).toEqual({ setType: 'normal', weightKg: 100, repMin: 10, repMax: 15 });
  });

  it('sin datos (ejercicio nuevo) → sin peso sugerido', () => {
    expect(
      recommendSet({ setNumber: 1, isCompound: true, scheme, targetRir: 1, todayTopWeightKg: null, lastWorkTop: null }).weightKg,
    ).toBeNull();
  });

  it('peso corporal: el back-off no se reduce', () => {
    const r = recommendSet({
      setNumber: 2,
      isCompound: true,
      scheme,
      targetRir: 1,
      todayTopWeightKg: 90,
      lastWorkTop: null,
      bodyweightLoaded: true,
    });
    expect(r.weightKg).toBe(90);
  });
});

test('defaultSetKind: compuesto 1ª top, resto back-off; aislamiento normal', () => {
  expect(defaultSetKind(1, true)).toBe('top');
  expect(defaultSetKind(3, true)).toBe('backoff');
  expect(defaultSetKind(1, false)).toBe('normal');
});
