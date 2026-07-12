import { allocateVolume, chooseSplit, EXERCISES_PER_SESSION } from './generator';

describe('chooseSplit', () => {
  it('sin prioridades devuelve la primera plantilla (preferencia editorial)', () => {
    expect(chooseSplit(3, [])?.key).toBe('ppl');
    expect(chooseSplit(4, [])?.key).toBe('ul');
  });

  it('con prioridad de hombro a 4 días gana torso/pierna (más frecuencia de hombro)', () => {
    // ul: 2 días de torso tocan hombro; ppl_fb: empuje + fullbody = 2 también → empate → gana ul (primera).
    expect(chooseSplit(4, ['hombro'])?.key).toBe('ul');
  });

  it('con prioridad de pierna a 5 días gana el split con más días de pierna', () => {
    const t = chooseSplit(5, ['pierna']);
    expect(t?.key).toBe('ppl_ul'); // 2 días de pierna vs 1 del "músculo por día"
  });

  it('días fuera de rango devuelve null', () => {
    expect(chooseSplit(1, [])).toBeNull();
  });
});

describe('allocateVolume', () => {
  it('principiante: mínimo del rango; avanzado: parte alta', () => {
    const beg = allocateVolume('principiante', 'volumen', [], ['pecho']);
    const adv = allocateVolume('avanzado', 'volumen', [], ['pecho']);
    expect(beg.pecho).toBe(10); // rango pecho 10-20
    expect(adv.pecho).toBe(18); // 10 + 0.8*10
  });

  it('prioritario va a la parte alta del rango', () => {
    const v = allocateVolume('intermedio', 'volumen', ['pecho'], ['pecho', 'espalda']);
    expect(v.pecho).toBe(20);
    expect(v.espalda).toBe(15); // 10 + 0.5*10
  });

  it('definición baja al mínimo (prioritario conserva un plus moderado)', () => {
    const v = allocateVolume('avanzado', 'definicion', ['pecho'], ['pecho', 'espalda']);
    expect(v.espalda).toBe(10);
    expect(v.pecho).toBe(14); // 10 + 0.4*10
  });

  it('normocalorica se comporta como el factor de nivel', () => {
    const v = allocateVolume('intermedio', 'normocalorica', [], ['pecho']);
    expect(v.pecho).toBe(15); // 10 + 0.5*10
  });
});

describe('EXERCISES_PER_SESSION', () => {
  it('presupuesto por tiempo: corta 4, normal 6, larga 7', () => {
    expect(EXERCISES_PER_SESSION).toEqual({ corta: 4, normal: 6, larga: 7 });
  });
});

import { adjustVolume, fillDay, generateRoutine, type GeneratedDay } from './generator';
import type { NamedExercise } from './recommend';

const GYM_CATALOG: NamedExercise[] = [
  { name: 'Press inclinado', muscleGroup: 'pecho' },
  { name: 'Press de pecho en máquina', muscleGroup: 'pecho' },
  { name: 'Contractora de pecho', muscleGroup: 'pecho' },
  { name: 'Fondos', muscleGroup: 'pecho' },
  { name: 'Aperturas', muscleGroup: 'pecho' },
  { name: 'Press militar', muscleGroup: 'hombro' },
  { name: 'Elevaciones laterales en polea', muscleGroup: 'hombro' },
  { name: 'Cruce inverso en polea', muscleGroup: 'hombro' },
  { name: 'Extensión tríceps sobre la cabeza', muscleGroup: 'triceps' },
  { name: 'Extensión tríceps polea', muscleGroup: 'triceps' },
  { name: 'Jalón al pecho', muscleGroup: 'espalda' },
  { name: 'Remo en máquina', muscleGroup: 'espalda' },
  { name: 'Remo Gironda', muscleGroup: 'espalda' },
  { name: 'Face pull', muscleGroup: 'espalda' },
  { name: 'Curl predicador', muscleGroup: 'biceps' },
  { name: 'Curl martillo', muscleGroup: 'biceps' },
  { name: 'Sentadilla', muscleGroup: 'pierna' },
  { name: 'Prensa', muscleGroup: 'pierna' },
  { name: 'Extensión cuádriceps', muscleGroup: 'pierna' },
  { name: 'Curl femoral sentado', muscleGroup: 'pierna' },
  { name: 'Peso muerto rumano', muscleGroup: 'pierna' },
  { name: 'Hip thrust', muscleGroup: 'gluteo' },
  { name: 'Gemelo de pie', muscleGroup: 'gemelo' },
  { name: 'Gemelo sentado', muscleGroup: 'gemelo' },
];

describe('fillDay', () => {
  it('respeta el presupuesto de ejercicios', () => {
    for (const budget of [4, 6, 7]) {
      expect(fillDay('empuje', budget, 'gym', [], GYM_CATALOG, 'intermedio').length).toBeLessThanOrEqual(budget);
    }
  });

  it('prioritarios van primero en el día', () => {
    const day = fillDay('empuje', 6, 'gym', ['hombro'], GYM_CATALOG, 'intermedio');
    expect(day[0].muscleGroup).toBe('hombro');
  });

  it('con solo peso corporal nunca propone máquina/barra/polea', () => {
    const day = fillDay('empuje', 6, 'bodyweight', [], GYM_CATALOG, 'intermedio');
    for (const e of day) expect(['Fondos']).toContain(e.name); // único bodyweight de empuje en el catálogo de prueba
  });

  it('catálogo insuficiente: día más corto, sin lanzar', () => {
    const day = fillDay('tiron', 6, 'bodyweight', [], GYM_CATALOG, 'intermedio');
    expect(day.length).toBeLessThan(6);
  });

  it('día de un solo músculo respeta el presupuesto hasta el tope metodológico', () => {
    // pecho: recommendCount 4 → tope 5 ejercicios/día
    expect(fillDay('pecho', 4, 'gym', [], GYM_CATALOG, 'intermedio').length).toBe(4);
    expect(fillDay('pecho', 7, 'gym', [], GYM_CATALOG, 'intermedio').length).toBe(5);
  });

  it('día de dos músculos a presupuesto alto reparte sin quedarse corto', () => {
    // tiron: espalda (4 en catálogo, tope 5) + biceps (2 en catálogo, tope 4).
    // El reparto por rondas alterna 1 en 1 entre ambos y llega a 3/3 antes de agotar
    // el presupuesto (el tope es metodológico, no conoce el catálogo); bíceps solo
    // tiene 2 ejercicios en el catálogo de prueba, así que lo alcanzable es 3+2=5.
    expect(fillDay('tiron', 6, 'gym', [], GYM_CATALOG, 'intermedio').length).toBe(5);
  });
});

describe('adjustVolume', () => {
  it('recorta series por encima del objetivo (mínimo 2 por ejercicio)', () => {
    const days: GeneratedDay[] = [
      { name: 'A', type: 'pecho', exercises: [
        { name: 'Press inclinado', muscleGroup: 'pecho', sets: 4, repMin: 8, repMax: 12 },
        { name: 'Aperturas', muscleGroup: 'pecho', sets: 4, repMin: 10, repMax: 15 },
        { name: 'Contractora de pecho', muscleGroup: 'pecho', sets: 4, repMin: 10, repMax: 15 },
      ] },
    ];
    const { days: adj } = adjustVolume(days, { pecho: 10 });
    const total = adj[0].exercises.reduce((s, e) => s + e.sets, 0);
    expect(total).toBeLessThanOrEqual(11); // objetivo 10 con tolerancia +1
    for (const e of adj[0].exercises) expect(e.sets).toBeGreaterThanOrEqual(2);
  });

  it('déficit grande frente al objetivo produce una razón explicativa', () => {
    const days: GeneratedDay[] = [
      { name: 'A', type: 'pecho', exercises: [{ name: 'Press inclinado', muscleGroup: 'pecho', sets: 3, repMin: 8, repMax: 12 }] },
    ];
    const { reasons } = adjustVolume(days, { pecho: 16 });
    expect(reasons.some((r) => r.toLowerCase().includes('pecho'))).toBe(true);
  });
});

describe('generateRoutine', () => {
  const base = { daysPerWeek: 3, level: 'intermedio' as const, scope: 'gym' as const, priorities: [], sessionTime: 'normal' as const, stage: 'volumen' as const };

  it('genera días con ejercicios y esquema completo', () => {
    const r = generateRoutine(base, GYM_CATALOG);
    expect(r.days.length).toBe(3);
    for (const d of r.days) {
      expect(d.exercises.length).toBeGreaterThan(0);
      for (const e of d.exercises) {
        expect(e.sets).toBeGreaterThanOrEqual(2);
        expect(e.repMin).toBeLessThanOrEqual(e.repMax);
      }
    }
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('principiante en gimnasio recibe el Full Body A/B de la metodología', () => {
    const r = generateRoutine({ ...base, level: 'principiante', priorities: ['pecho'] }, GYM_CATALOG);
    expect(r.days.map((d) => d.name)).toEqual(['Full body A', 'Full body B']);
    const squat = r.days[0].exercises.find((e) => e.name === 'Sentadilla');
    expect(squat?.sets).toBe(4);
    expect(r.reasons.some((r2) => r2.toLowerCase().includes('full body'))).toBe(true);
  });

  it('es determinista: misma entrada, misma salida', () => {
    expect(generateRoutine(base, GYM_CATALOG)).toEqual(generateRoutine(base, GYM_CATALOG));
  });

  it('días/semana sin plantilla no rompe (usa 3 días y lo explica)', () => {
    const r = generateRoutine({ ...base, daysPerWeek: 9 }, GYM_CATALOG);
    expect(r.days.length).toBe(3);
    expect(r.reasons.some((x) => x.includes('3 días'))).toBe(true);
  });

  it('prioridad no cubierta por el reparto: razón honesta, no la de frecuencia', () => {
    const r = generateRoutine({ ...base, priorities: ['core'] }, GYM_CATALOG);
    expect(r.reasons.some((x) => x.includes('core'))).toBe(true);
    expect(r.reasons.some((x) => x.includes('más veces por semana trabaja core'))).toBe(false);
    expect(r.days.length).toBe(3);
    for (const d of r.days) expect(d.exercises.length).toBeGreaterThan(0);
  });

  it('principiante a 5 días: explica que más días no aceleran el progreso', () => {
    const r = generateRoutine({ ...base, level: 'principiante', daysPerWeek: 5 }, GYM_CATALOG);
    expect(r.reasons.some((x) => x.includes('más días'))).toBe(true);
  });

  it('principiante sin gimnasio: no da el atajo Full Body A/B y explica el material', () => {
    const r = generateRoutine({ ...base, level: 'principiante', scope: 'bodyweight' }, GYM_CATALOG);
    expect(r.days.map((d) => d.name)).not.toEqual(['Full body A', 'Full body B']);
    expect(r.reasons.some((x) => x.includes('material'))).toBe(true);
  });
});
