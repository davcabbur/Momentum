import { estimateOneRepMax } from '@/training/progression';

/**
 * Familias de ejercicios que cuentan para cada lift del Big 3. Solo variantes
 * comparables (peso libre / multipower); máquinas guiadas o remos no cuentan.
 */
export const BIG3_FAMILIES: Record<'squat' | 'bench' | 'dead', string[]> = {
  squat: ['Sentadilla', 'Sentadilla con pausa', 'Sentadilla frontal', 'Sentadilla en Smith'],
  bench: ['Press banca', 'Press en Smith', 'Press Larson'],
  dead: ['Peso muerto', 'Peso muerto sumo', 'Peso muerto con barra trap'],
};

export interface LiftRow {
  name: string;
  weightKg: number;
  reps: number;
  setType: string;
}

export interface Big3Best {
  squat: number;
  bench: number;
  dead: number;
}

/**
 * Mejor 1RM estimado por lift a partir del historial de series. Ignora calentamientos
 * y series de más de 12 reps (el 1RM estimado a reps muy altas no es fiable).
 */
export function bestBig3(rows: LiftRow[]): Big3Best {
  const best: Big3Best = { squat: 0, bench: 0, dead: 0 };
  for (const r of rows) {
    if (r.setType === 'warmup' || r.reps < 1 || r.reps > 12) continue;
    const e = estimateOneRepMax(r.weightKg, r.reps);
    (Object.keys(BIG3_FAMILIES) as (keyof Big3Best)[]).forEach((k) => {
      if (BIG3_FAMILIES[k].includes(r.name)) best[k] = Math.max(best[k], e);
    });
  }
  return best;
}
