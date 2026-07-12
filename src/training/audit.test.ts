import { auditRoutine, type AuditDay } from './audit';

const ex = (name: string, muscleGroup: string, targetSets: number, pattern = '') => ({ name, muscleGroup, targetSets, pattern });

describe('auditRoutine', () => {
  it('rutina equilibrada: sin avisos de volumen', () => {
    const days: AuditDay[] = [
      { name: 'A', exercises: [ex('Press banca', 'pecho', 6, 'empuje'), ex('Remo barra', 'espalda', 6), ex('Sentadilla', 'pierna', 6)] },
      { name: 'B', exercises: [ex('Press inclinado', 'pecho', 6, 'empuje'), ex('Jalón al pecho', 'espalda', 6), ex('Prensa', 'pierna', 6)] },
    ];
    const advs = auditRoutine(days);
    expect(advs.filter((a) => a.kind === 'volumen-alto')).toHaveLength(0);
    // 12 series pecho/espalda/pierna: en rango (10-20).
  });

  it('exceso de volumen: aviso volumen-alto', () => {
    const days: AuditDay[] = [
      { name: 'A', exercises: [ex('Aperturas', 'pecho', 12), ex('Cruces en polea', 'pecho', 12)] },
    ];
    const advs = auditRoutine(days);
    expect(advs.some((a) => a.kind === 'volumen-alto' && a.text.includes('Pecho'))).toBe(true);
  });

  it('músculo grande sin trabajar: aviso musculo-olvidado', () => {
    const days: AuditDay[] = [
      { name: 'A', exercises: [ex('Press banca', 'pecho', 12), ex('Remo barra', 'espalda', 12)] },
    ];
    const advs = auditRoutine(days);
    expect(advs.some((a) => a.kind === 'musculo-olvidado' && a.text.toLowerCase().includes('pierna'))).toBe(true);
  });

  it('empujes en días consecutivos: delega el aviso de hombro', () => {
    const days: AuditDay[] = [
      { name: 'Empuje A', exercises: [ex('Press banca', 'pecho', 4, 'empuje'), ex('Press militar', 'hombro', 4, 'empuje'), ex('Sentadilla', 'pierna', 10)] },
      { name: 'Empuje B', exercises: [ex('Press inclinado', 'pecho', 4, 'empuje'), ex('Elevaciones laterales', 'hombro', 4), ex('Remo barra', 'espalda', 10)] },
    ];
    const advs = auditRoutine(days);
    expect(advs.some((a) => a.kind === 'shoulder')).toBe(true);
  });

  it('no emite avisos "ok" (solo info/warn)', () => {
    const days: AuditDay[] = [
      { name: 'A', exercises: [ex('Press banca', 'pecho', 12), ex('Remo barra', 'espalda', 12), ex('Sentadilla', 'pierna', 12)] },
    ];
    for (const a of auditRoutine(days)) {
      expect(['volumen-alto', 'volumen-bajo', 'musculo-olvidado', 'shoulder']).toContain(a.kind);
    }
  });
});
