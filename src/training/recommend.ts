import { exerciseMeta, type Equipment } from './exercise-meta';

/** Material disponible: gimnasio completo, mancuernas en casa, o solo peso corporal. */
export type EquipmentScope = 'gym' | 'dumbbell' | 'bodyweight';

function allowed(scope: EquipmentScope, eq: Equipment): boolean {
  if (scope === 'gym') return true;
  if (scope === 'dumbbell') return eq === 'dumbbell' || eq === 'bodyweight';
  return eq === 'bodyweight';
}

const LARGE = new Set(['pecho', 'espalda', 'pierna']);

/** Cuántos ejercicios recomendar para un músculo (grandes más que pequeños). */
export function recommendCount(muscle: string): number {
  return LARGE.has(muscle) ? 4 : 3;
}

export interface NamedExercise {
  name: string;
  muscleGroup: string;
}

/**
 * Recomienda los mejores ejercicios para un músculo: prioriza compuestos y
 * cubre las distintas regiones, filtrando por el material disponible.
 */
export function recommendForMuscle(
  all: NamedExercise[],
  muscle: string,
  opts: { scope?: EquipmentScope; max?: number } = {},
): string[] {
  const scope = opts.scope ?? 'gym';
  const max = opts.max ?? recommendCount(muscle);

  const cands = all
    .map((e) => ({ name: e.name, meta: exerciseMeta(e.name) }))
    .filter((x): x is { name: string; meta: NonNullable<ReturnType<typeof exerciseMeta>> } => {
      return x.meta != null && all.some((e) => e.name === x.name && e.muscleGroup === muscle) && allowed(scope, x.meta.equipment);
    });

  // Compuestos primero (orden estable dentro de cada grupo).
  cands.sort((a, b) => Number(b.meta.compound) - Number(a.meta.compound));

  const picked: string[] = [];
  const regions = new Set<string>();
  // 1ª pasada: una por región distinta.
  for (const c of cands) {
    if (picked.length >= max) break;
    if (!regions.has(c.meta.region)) {
      regions.add(c.meta.region);
      picked.push(c.name);
    }
  }
  // 2ª pasada: rellenar si falta, con los mejores restantes.
  for (const c of cands) {
    if (picked.length >= max) break;
    if (!picked.includes(c.name)) picked.push(c.name);
  }
  return picked;
}
