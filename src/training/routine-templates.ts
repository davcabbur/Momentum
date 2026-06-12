export interface RoutineTemplate {
  key: string;
  name: string;
  /** Nombres de los días que se crearán. */
  days: string[];
}

const TEMPLATES: Record<number, RoutineTemplate[]> = {
  2: [{ key: 'fb2', name: 'Full Body (A/B)', days: ['Full body A', 'Full body B'] }],
  3: [
    { key: 'ppl', name: 'PPL (Empuje/Tirón/Pierna)', days: ['Empuje', 'Tirón', 'Pierna'] },
    { key: 'fb3', name: 'Full Body ×3', days: ['Full body A', 'Full body B', 'Full body C'] },
  ],
  4: [
    { key: 'ul', name: 'Torso / Pierna', days: ['Torso A', 'Pierna A', 'Torso B', 'Pierna B'] },
    { key: 'ppl_fb', name: 'PPL + Full body', days: ['Empuje', 'Tirón', 'Pierna', 'Full body'] },
  ],
  5: [
    { key: 'ppl_ul', name: 'PPL + Torso/Pierna', days: ['Empuje', 'Tirón', 'Pierna', 'Torso', 'Pierna'] },
    { key: 'bro5', name: 'Músculo por día', days: ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo'] },
  ],
  6: [
    { key: 'ppl2', name: 'PPL ×2', days: ['Empuje A', 'Tirón A', 'Pierna A', 'Empuje B', 'Tirón B', 'Pierna B'] },
    { key: 'bro6', name: 'Músculo por día', days: ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo', 'Core'] },
  ],
};

/** Plantillas de rutina recomendadas para ese número de días por semana. */
export function routineTemplatesFor(daysPerWeek: number): RoutineTemplate[] {
  return TEMPLATES[daysPerWeek] ?? [];
}

export const DAYS_PER_WEEK_OPTIONS = [2, 3, 4, 5, 6];
