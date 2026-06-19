export type TemplateDay = { name: string; type: string };

export interface RoutineTemplate {
  key: string;
  name: string;
  days: TemplateDay[];
}

/** Ejercicios por defecto por tipo de día (nombres del catálogo inicial). */
// Ejercicios por defecto por día, elegidos con las tier-lists (S/A): compuestos primero,
// cubriendo las regiones de cada músculo. Editables después por el usuario.
const DAY_EXERCISES: Record<string, string[]> = {
  empuje: ['Press inclinado', 'Press de pecho en máquina', 'Press militar', 'Elevaciones laterales en polea', 'Extensión tríceps sobre la cabeza'],
  tiron: ['Jalón al pecho', 'Remo en máquina', 'Remo Gironda', 'Face pull', 'Curl predicador', 'Curl martillo'],
  pierna: ['Sentadilla', 'Extensión cuádriceps', 'Peso muerto rumano', 'Curl femoral sentado', 'Hip thrust', 'Gemelo de pie'],
  // Dos días de pierna complementarios (para rutinas con doble día): uno con énfasis
  // en cuádriceps y gemelo de pie (gastrocnemio), otro en femoral/glúteo y gemelo sentado (sóleo).
  pierna1: ['Sentadilla', 'Prensa', 'Extensión cuádriceps', 'Curl femoral sentado', 'Hip thrust', 'Gemelo de pie'],
  pierna2: ['Peso muerto rumano', 'Curl femoral', 'Curl femoral sentado', 'Sentadilla búlgara', 'Hip thrust', 'Gemelo sentado'],
  torso: ['Press inclinado', 'Jalón al pecho', 'Remo en máquina', 'Elevaciones laterales en polea', 'Extensión tríceps sobre la cabeza', 'Curl predicador'],
  fullbody: ['Sentadilla', 'Press inclinado', 'Remo en máquina', 'Press militar', 'Curl martillo'],
  // Músculo por día: cubre las regiones con los mejores de cada tier-list.
  pecho: ['Press inclinado', 'Press de pecho en máquina', 'Contractora de pecho', 'Fondos'],
  espalda: ['Jalón al pecho', 'Remo en máquina', 'Remo Gironda', 'Pullover en polea', 'Face pull'],
  hombro: ['Press militar', 'Elevaciones laterales en polea', 'Elevación lateral inclinada', 'Cruce inverso en polea'],
  brazo: ['Curl predicador', 'Curl martillo', 'Curl con barra Z', 'Extensión tríceps sobre la cabeza', 'Extensión tríceps polea'],
  core: ['Crunch declinado', 'Elevación de piernas', 'Rotación de torso'],
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
      { name: 'Pierna A (cuádriceps)', type: 'pierna1' },
      { name: 'Torso B', type: 'torso' },
      { name: 'Pierna B (femoral/glúteo)', type: 'pierna2' },
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
      { name: 'Pierna (cuádriceps)', type: 'pierna1' },
      { name: 'Torso', type: 'torso' },
      { name: 'Pierna 2 (femoral/glúteo)', type: 'pierna2' },
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
      { name: 'Pierna A (cuádriceps)', type: 'pierna1' },
      { name: 'Empuje B', type: 'empuje' },
      { name: 'Tirón B', type: 'tiron' },
      { name: 'Pierna B (femoral/glúteo)', type: 'pierna2' },
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
