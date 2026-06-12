export type Level = 'principiante' | 'intermedio' | 'avanzado';

export interface RepScheme {
  sets: number;
  repMin: number;
  repMax: number;
  rirMin: number;
  rirMax: number;
}

const SCHEMES: Record<Level, RepScheme> = {
  principiante: { sets: 3, repMin: 8, repMax: 12, rirMin: 2, rirMax: 3 },
  intermedio: { sets: 4, repMin: 6, repMax: 12, rirMin: 1, rirMax: 3 },
  avanzado: { sets: 4, repMin: 6, repMax: 10, rirMin: 0, rirMax: 2 },
};

export function schemeForLevel(level: Level): RepScheme {
  return SCHEMES[level];
}

/** Texto del objetivo, p. ej. "3×8–12 · RIR 2–3". */
export function describeScheme(s: RepScheme): string {
  const rir = s.rirMin === s.rirMax ? `${s.rirMin}` : `${s.rirMin}–${s.rirMax}`;
  return `${s.sets}×${s.repMin}–${s.repMax} · RIR ${rir}`;
}
