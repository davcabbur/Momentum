/**
 * Generador de rutinas a medida (fase D). Motor determinista de reglas:
 * mismas entradas → misma rutina. Cada decisión produce un "porqué" educativo.
 */
import { type Level } from './levels';
import { routineTemplatesFor, type RoutineTemplate } from './routine-templates';
import { weeklyVolumeRange, weeklyMuscleVolume } from './volume';
import { defaultScheme } from './default-scheme';
import { recommendForMuscle, recommendCount, type EquipmentScope, type NamedExercise } from './recommend';
import { auditRoutine } from './audit';
import type { Advice } from './intelligence';

export type SessionTime = 'corta' | 'normal' | 'larga';
export type Stage = 'volumen' | 'definicion' | 'normocalorica';

/** Músculos que trabaja cada tipo de día de las plantillas. */
export const MUSCLES_BY_DAY_TYPE: Record<string, string[]> = {
  empuje: ['pecho', 'hombro', 'triceps'],
  tiron: ['espalda', 'biceps'],
  pierna: ['pierna', 'gluteo', 'gemelo'],
  pierna1: ['pierna', 'gluteo', 'gemelo'],
  pierna2: ['pierna', 'gluteo', 'gemelo'],
  torso: ['pecho', 'espalda', 'hombro', 'triceps', 'biceps'],
  fullbody: ['pierna', 'pecho', 'espalda', 'hombro', 'biceps'],
  pecho: ['pecho'],
  espalda: ['espalda'],
  hombro: ['hombro'],
  brazo: ['biceps', 'triceps'],
  core: ['core'],
};

/** Ejercicios que caben por sesión según el tiempo disponible. */
export const EXERCISES_PER_SESSION: Record<SessionTime, number> = { corta: 4, normal: 6, larga: 7 };

/** Elige el esqueleto de split: el que más veces/semana trabaja los prioritarios. */
export function chooseSplit(daysPerWeek: number, priorities: string[]): RoutineTemplate | null {
  const templates = routineTemplatesFor(daysPerWeek);
  if (templates.length === 0) return null;
  if (priorities.length === 0) return templates[0];
  let best = templates[0];
  let bestScore = -1;
  for (const t of templates) {
    let score = 0;
    for (const d of t.days) {
      for (const p of priorities) {
        if ((MUSCLES_BY_DAY_TYPE[d.type] ?? []).includes(p)) score++;
      }
    }
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}

// Punto del rango de volumen según nivel (0 = mínimo, 1 = máximo del rango).
const LEVEL_FACTOR: Record<Level, number> = { principiante: 0, intermedio: 0.5, avanzado: 0.8 };
const PRIORITY_FACTOR = 1;
const DEFICIT_PRIORITY_FACTOR = 0.4; // en definición, el prioritario conserva un plus moderado

/** Series semanales objetivo por músculo, siempre dentro de weeklyVolumeRange. */
export function allocateVolume(level: Level, stage: Stage, priorities: string[], muscles: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of muscles) {
    const { min, max } = weeklyVolumeRange(m);
    let f = priorities.includes(m) ? PRIORITY_FACTOR : LEVEL_FACTOR[level];
    if (stage === 'definicion') f = priorities.includes(m) ? DEFICIT_PRIORITY_FACTOR : 0;
    out[m] = Math.round(min + f * (max - min));
  }
  return out;
}

export interface GeneratorInput {
  daysPerWeek: number;
  level: Level;
  scope: EquipmentScope;
  priorities: string[];
  sessionTime: SessionTime;
  stage: Stage;
}

export interface GeneratedExercise { name: string; muscleGroup: string; sets: number; repMin: number; repMax: number }
export interface GeneratedDay { name: string; type: string; exercises: GeneratedExercise[] }
export interface GeneratedRoutine { name: string; days: GeneratedDay[]; reasons: string[]; warnings: Advice[] }

export type GeneratorCatalogItem = NamedExercise & { pattern?: string };

const LARGE_MUSCLES = new Set(['pecho', 'espalda', 'pierna']);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Rellena un día: prioritarios primero, huecos extra a prioritarios y músculos grandes. */
export function fillDay(type: string, budget: number, scope: EquipmentScope, priorities: string[], catalog: NamedExercise[], level: Level): GeneratedExercise[] {
  const muscles = MUSCLES_BY_DAY_TYPE[type] ?? [];
  if (muscles.length === 0 || budget <= 0) return [];
  const ordered = [...muscles].sort((a, b) => Number(priorities.includes(b)) - Number(priorities.includes(a)));

  // 1 hueco por músculo; los restantes se reparten (prioritarios y grandes primero, en rondas).
  const counts = new Map<string, number>(ordered.map((m) => [m, 1]));
  const extraOrder = [...ordered].sort((a, b) => {
    const pa = Number(priorities.includes(b)) - Number(priorities.includes(a));
    if (pa !== 0) return pa;
    return Number(LARGE_MUSCLES.has(b)) - Number(LARGE_MUSCLES.has(a));
  });
  // 1 hueco por músculo; los restantes se reparten en rondas (prioritarios y grandes
  // primero) hasta agotar el presupuesto, con tope por músculo: más de ~4-5 ejercicios
  // del mismo músculo en un día ya no aporta (series basura).
  const capOf = (m: string) => recommendCount(m) + 1;
  let left = budget - ordered.length;
  let i = 0;
  const maxIters = extraOrder.length * 8; // corta el bucle si todos los músculos tocan techo
  while (left > 0 && i < maxIters) {
    const m = extraOrder[i % extraOrder.length];
    if ((counts.get(m) ?? 0) < capOf(m)) {
      counts.set(m, (counts.get(m) ?? 0) + 1);
      left--;
    }
    i++;
  }

  const out: GeneratedExercise[] = [];
  for (const m of ordered) {
    const names = recommendForMuscle(catalog, m, { scope, max: counts.get(m) ?? 1 });
    for (const n of names) {
      const sc = defaultScheme(n, level);
      out.push({ name: n, muscleGroup: m, sets: sc.sets, repMin: sc.repMin, repMax: sc.repMax });
    }
  }
  return out.slice(0, budget);
}

const MIN_SETS = 2;
const TOLERANCE = 1; // media serie arriba/abajo no merece recorte

/** Ajusta las series al objetivo semanal: recorta por el final (min 2/ejercicio) y explica los déficits. */
export function adjustVolume(days: GeneratedDay[], targets: Record<string, number>): { days: GeneratedDay[]; reasons: string[] } {
  const copy: GeneratedDay[] = days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) }));
  const reasons: string[] = [];
  const volumeOf = (m: string) =>
    weeklyMuscleVolume(copy.flatMap((d) => d.exercises.map((e) => ({ name: e.name, muscleGroup: e.muscleGroup, targetSets: e.sets }))))[m] ?? 0;

  for (const [m, target] of Object.entries(targets)) {
    let guard = 40;
    while (volumeOf(m) > target + TOLERANCE && guard-- > 0) {
      const cand = [...copy]
        .reverse()
        .flatMap((d) => [...d.exercises].reverse())
        .find((e) => e.muscleGroup === m && e.sets > MIN_SETS);
      if (!cand) break;
      cand.sets -= 1;
    }
    const v = volumeOf(m);
    if (target - v >= 3) {
      reasons.push(
        `${cap(m)}: con este tiempo por sesión salen ~${Math.round(v)} series/semana (objetivo ~${target}). Para acercarte, añade un día o alarga la sesión; con lo planificado también se progresa.`,
      );
    }
  }
  return { days: copy, reasons };
}

// Full Body A/B de la metodología para empezar (3×(8–12); sentadilla y peso muerto rumano a 4 series).
const BEGINNER_AB: GeneratedDay[] = [
  { name: 'Full body A', type: 'fullbody', exercises: [
    { name: 'Press inclinado', muscleGroup: 'pecho', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Aperturas', muscleGroup: 'pecho', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Press militar', muscleGroup: 'hombro', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Sentadilla', muscleGroup: 'pierna', sets: 4, repMin: 8, repMax: 12 },
  ] },
  { name: 'Full body B', type: 'fullbody', exercises: [
    { name: 'Jalón al pecho', muscleGroup: 'espalda', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Remo mancuerna', muscleGroup: 'espalda', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Curl bíceps', muscleGroup: 'biceps', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Peso muerto rumano', muscleGroup: 'pierna', sets: 4, repMin: 8, repMax: 12 },
  ] },
];

const FALLBACK_DAYS = 3;

/** Genera la rutina completa. Determinista; cada decisión deja su porqué en `reasons`. */
export function generateRoutine(input: GeneratorInput, catalog: GeneratorCatalogItem[]): GeneratedRoutine {
  const reasons: string[] = [];

  if (input.level === 'principiante' && input.scope === 'gym') {
    reasons.push(
      'Para empezar, lo que mejor funciona es un Full Body A/B sencillo: compuestos, técnica y progresar de 8 a 12 repeticiones antes de subir peso. Alterna A y B con un descanso entre medias.',
    );
    if (input.priorities.length > 0) {
      reasons.push('De inicio no hace falta priorizar músculos: con lo básico crece todo a la vez. Las prioridades tendrán sentido cuando lleves unos meses.');
    }
    if (input.daysPerWeek > 3) {
      reasons.push('Al empezar, más días no aceleran el progreso: con el A/B alternado (3-4 sesiones/semana) creces igual y te recuperas mejor.');
    }
    const days = BEGINNER_AB.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) }));
    return { name: 'Full Body A/B', days, reasons, warnings: auditForGenerated(days, catalog) };
  }

  if (input.level === 'principiante') {
    reasons.push('Con tu material te preparo un reparto sencillo. Cuando entrenes en un gimnasio, el Full Body A/B clásico de iniciación te irá genial.');
  }

  let template = chooseSplit(input.daysPerWeek, input.priorities);
  if (!template) {
    template = chooseSplit(FALLBACK_DAYS, input.priorities);
    reasons.push(`Para ${input.daysPerWeek} días no tengo un reparto probado, así que he preparado uno de 3 días; añade o cambia días cuando quieras.`);
  }
  if (!template) return { name: 'Rutina', days: [], reasons, warnings: [] };

  const muscles = [...new Set(template.days.flatMap((d) => MUSCLES_BY_DAY_TYPE[d.type] ?? []))];
  const covered = input.priorities.filter((p) => muscles.includes(p));
  const uncovered = input.priorities.filter((p) => !muscles.includes(p));

  if (covered.length > 0) {
    reasons.push(
      `He elegido «${template.name}»: es el reparto que más veces por semana trabaja ${covered.join(' y ')}. Van al principio de su día, que es cuando estás fresco.`,
    );
  } else {
    reasons.push(`He elegido «${template.name}», un reparto equilibrado para ${template.days.length} días.`);
  }
  if (uncovered.length > 0) {
    reasons.push(
      `Este reparto no tiene un día que trabaje ${uncovered.join(' y ')} directamente; añádelo donde prefieras con «＋ Ejercicio» al editar la rutina.`,
    );
  }
  if (input.stage === 'definicion') {
    reasons.push('En definición dejo el volumen cerca del mínimo eficaz: en déficit se recupera peor, y más series no son más músculo.');
  }

  const targets = allocateVolume(input.level, input.stage, covered, muscles);
  const budget = EXERCISES_PER_SESSION[input.sessionTime];

  const rawDays: GeneratedDay[] = template.days.map((d) => ({
    name: d.name,
    type: d.type,
    exercises: fillDay(d.type, budget, input.scope, covered, catalog, input.level),
  }));
  for (const d of rawDays) {
    if (d.exercises.length < Math.min(budget, 3)) {
      reasons.push(`«${d.name}» sale corto: con el material elegido no hay muchos ejercicios que encajen. Puedes añadir los tuyos al catálogo.`);
    }
  }

  const adj = adjustVolume(rawDays, targets);
  reasons.push(...adj.reasons);

  return { name: `A medida · ${template.name}`, days: adj.days, reasons, warnings: auditForGenerated(adj.days, catalog) };
}

/** Audita la rutina generada usando el pattern del catálogo (para el aviso de hombro). */
function auditForGenerated(days: GeneratedDay[], catalog: GeneratorCatalogItem[]): Advice[] {
  const patternOf = new Map(catalog.map((e) => [e.name, e.pattern ?? '']));
  return auditRoutine(
    days.map((d) => ({
      name: d.name,
      exercises: d.exercises.map((e) => ({ name: e.name, muscleGroup: e.muscleGroup, targetSets: e.sets, pattern: patternOf.get(e.name) ?? '' })),
    })),
  );
}
