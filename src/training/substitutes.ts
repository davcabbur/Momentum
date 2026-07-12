import { exerciseMeta, type ExMeta } from './exercise-meta';
import { equipmentAllowed, type EquipmentScope, type NamedExercise } from './recommend';

export interface SubstituteSuggestion {
  name: string;
  reason: string;
}

const MAX_SUGGESTIONS = 6;

/** Rango de afinidad: 0 misma región y material · 1 misma región · 2 mismo músculo. */
function rank(self: ExMeta | null, cand: ExMeta): number {
  if (!self) return 2;
  if (cand.region === self.region && cand.equipment === self.equipment) return 0;
  if (cand.region === self.region) return 1;
  return 2;
}

const REASONS = ['misma zona, mismo material', 'misma zona, distinto material', 'mismo músculo'];

/**
 * Equivalentes de un ejercicio para sustituirlo: mismo músculo, filtrados por
 * material, ordenados por afinidad (región/material) y compuestos primero.
 */
export function substitutesFor(
  exerciseName: string,
  catalog: NamedExercise[],
  scope: EquipmentScope,
): SubstituteSuggestion[] {
  const self = catalog.find((e) => e.name === exerciseName);
  if (!self) return [];
  const selfMeta = exerciseMeta(exerciseName) ?? null;

  const cands = catalog
    .filter((e) => e.muscleGroup === self.muscleGroup && e.name !== exerciseName)
    .map((e) => ({ name: e.name, meta: exerciseMeta(e.name) }))
    .filter((x): x is { name: string; meta: ExMeta } => x.meta != null && equipmentAllowed(scope, x.meta.equipment));

  cands.sort((a, b) => {
    const r = rank(selfMeta, a.meta) - rank(selfMeta, b.meta);
    if (r !== 0) return r;
    return Number(b.meta.compound) - Number(a.meta.compound);
  });

  return cands.slice(0, MAX_SUGGESTIONS).map((x) => ({ name: x.name, reason: REASONS[rank(selfMeta, x.meta)] }));
}
