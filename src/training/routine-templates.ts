export type TemplateDay = { name: string; type: string };

export interface RoutineTemplate {
  key: string;
  name: string;
  days: TemplateDay[];
}

/** Ejercicios por defecto por tipo de día (nombres del catálogo inicial). */
const DAY_EXERCISES: Record<string, string[]> = {
  empuje: ['Press inclinado', 'Press banca', 'Press militar', 'Elevaciones laterales', 'Press francés'],
  tiron: ['Jalón al pecho', 'Remo mancuerna', 'Remo barra', 'Curl bíceps'],
  pierna: ['Sentadilla', 'Prensa', 'Curl femoral', 'Extensión cuádriceps', 'Gemelo de pie'],
  torso: ['Press inclinado', 'Jalón al pecho', 'Press militar', 'Curl bíceps', 'Press francés'],
  fullbody: ['Press inclinado', 'Jalón al pecho', 'Sentadilla', 'Press militar', 'Curl bíceps'],
  // 4 esenciales por región: inclinado (superior), banca (medio), aperturas (aísla), fondos (inferior)
  pecho: ['Press inclinado', 'Press banca', 'Aperturas', 'Fondos'],
  espalda: ['Jalón al pecho', 'Remo mancuerna', 'Remo Gironda', 'Face pull'],
  hombro: ['Press militar', 'Elevaciones laterales', 'Pájaros'],
  brazo: ['Curl bíceps', 'Extensión tríceps polea', 'Extensión tríceps sobre la cabeza'],
  core: [],
};

export function exercisesForType(type: string): string[] {
  return DAY_EXERCISES[type] ?? [];
}

const TEMPLATES: Record<number, RoutineTemplate[]> = {
  2: [
    { key: 'fb2', name: 'Full Body (A/B)', days: [
      { name: 'Full body A', type: 'fullbody' },
      { name: 'Full body B', type: 'fullbody' },
    ] },
  ],
  3: [
    { key: 'ppl', name: 'PPL (Empuje/Tirón/Pierna)', days: [
      { name: 'Empuje', type: 'empuje' },
      { name: 'Tirón', type: 'tiron' },
      { name: 'Pierna', type: 'pierna' },
    ] },
    { key: 'fb3', name: 'Full Body ×3', days: [
      { name: 'Full body A', type: 'fullbody' },
      { name: 'Full body B', type: 'fullbody' },
      { name: 'Full body C', type: 'fullbody' },
    ] },
  ],
  4: [
    { key: 'ul', name: 'Torso / Pierna', days: [
      { name: 'Torso A', type: 'torso' },
      { name: 'Pierna A', type: 'pierna' },
      { name: 'Torso B', type: 'torso' },
      { name: 'Pierna B', type: 'pierna' },
    ] },
    { key: 'ppl_fb', name: 'PPL + Full body', days: [
      { name: 'Empuje', type: 'empuje' },
      { name: 'Tirón', type: 'tiron' },
      { name: 'Pierna', type: 'pierna' },
      { name: 'Full body', type: 'fullbody' },
    ] },
  ],
  5: [
    { key: 'ppl_ul', name: 'PPL + Torso/Pierna', days: [
      { name: 'Empuje', type: 'empuje' },
      { name: 'Tirón', type: 'tiron' },
      { name: 'Pierna', type: 'pierna' },
      { name: 'Torso', type: 'torso' },
      { name: 'Pierna 2', type: 'pierna' },
    ] },
    { key: 'bro5', name: 'Músculo por día', days: [
      { name: 'Pecho', type: 'pecho' },
      { name: 'Espalda', type: 'espalda' },
      { name: 'Pierna', type: 'pierna' },
      { name: 'Hombro', type: 'hombro' },
      { name: 'Brazo', type: 'brazo' },
    ] },
  ],
  6: [
    { key: 'ppl2', name: 'PPL ×2', days: [
      { name: 'Empuje A', type: 'empuje' },
      { name: 'Tirón A', type: 'tiron' },
      { name: 'Pierna A', type: 'pierna' },
      { name: 'Empuje B', type: 'empuje' },
      { name: 'Tirón B', type: 'tiron' },
      { name: 'Pierna B', type: 'pierna' },
    ] },
    { key: 'bro6', name: 'Músculo por día', days: [
      { name: 'Pecho', type: 'pecho' },
      { name: 'Espalda', type: 'espalda' },
      { name: 'Pierna', type: 'pierna' },
      { name: 'Hombro', type: 'hombro' },
      { name: 'Brazo', type: 'brazo' },
      { name: 'Core', type: 'core' },
    ] },
  ],
};

export function routineTemplatesFor(daysPerWeek: number): RoutineTemplate[] {
  return TEMPLATES[daysPerWeek] ?? [];
}

export const DAYS_PER_WEEK_OPTIONS = [2, 3, 4, 5, 6];
