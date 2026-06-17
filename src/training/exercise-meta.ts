/**
 * Metadatos por ejercicio para la recomendación inteligente (fase D):
 * - region: qué parte del músculo enfatiza (para cubrir todas las regiones).
 * - equipment: material principal (para filtrar por lo que tienes).
 * - compound: compuesto (se priorizan sobre el aislamiento).
 * Sacado de la metodología de selección por músculo.
 */
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';

export interface ExMeta {
  region: string;
  equipment: Equipment;
  compound: boolean;
}

export const EXERCISE_META: Record<string, ExMeta> = {
  // Pecho
  'Press inclinado': { region: 'superior', equipment: 'dumbbell', compound: true },
  'Press banca': { region: 'medio', equipment: 'barbell', compound: true },
  'Press plano mancuerna': { region: 'medio', equipment: 'dumbbell', compound: true },
  Aperturas: { region: 'estiramiento', equipment: 'dumbbell', compound: false },
  Fondos: { region: 'inferior', equipment: 'bodyweight', compound: true },
  'Cruces en polea': { region: 'estiramiento', equipment: 'cable', compound: false },
  'Press declinado': { region: 'inferior', equipment: 'barbell', compound: true },
  // Hombro
  'Press militar': { region: 'anterior', equipment: 'dumbbell', compound: true },
  'Elevaciones laterales': { region: 'lateral', equipment: 'dumbbell', compound: false },
  Pájaros: { region: 'posterior', equipment: 'dumbbell', compound: false },
  'Press hombro en máquina': { region: 'anterior', equipment: 'machine', compound: true },
  'Press militar con barra': { region: 'anterior', equipment: 'barbell', compound: true },
  'Elevaciones laterales en polea': { region: 'lateral', equipment: 'cable', compound: false },
  'Aperturas inversas': { region: 'posterior', equipment: 'machine', compound: false },
  // Tríceps
  'Press francés': { region: 'lateral-media', equipment: 'barbell', compound: false },
  'Extensión tríceps polea': { region: 'lateral-media', equipment: 'cable', compound: false },
  'Extensión tríceps sobre la cabeza': { region: 'larga', equipment: 'cable', compound: false },
  'Patada de tríceps': { region: 'aislamiento', equipment: 'dumbbell', compound: false },
  'Extensión tríceps unilateral': { region: 'larga', equipment: 'dumbbell', compound: false },
  // Espalda
  'Jalón al pecho': { region: 'vertical', equipment: 'cable', compound: true },
  'Remo mancuerna': { region: 'horizontal', equipment: 'dumbbell', compound: true },
  'Remo barra': { region: 'horizontal', equipment: 'barbell', compound: true },
  Dominadas: { region: 'vertical', equipment: 'bodyweight', compound: true },
  'Remo Gironda': { region: 'dorsal-bajo', equipment: 'cable', compound: true },
  Pullover: { region: 'dorsal-bajo', equipment: 'dumbbell', compound: false },
  'Encogimiento de hombros': { region: 'trapecio', equipment: 'dumbbell', compound: false },
  'Face pull': { region: 'posterior', equipment: 'cable', compound: false },
  'Encogimientos de Kelso': { region: 'trapecio', equipment: 'cable', compound: false },
  'Dominadas escapulares': { region: 'trapecio', equipment: 'bodyweight', compound: false },
  // Bíceps
  'Curl bíceps': { region: 'corta', equipment: 'dumbbell', compound: false },
  'Curl inclinado': { region: 'larga', equipment: 'dumbbell', compound: false },
  'Curl concentrado': { region: 'corta', equipment: 'dumbbell', compound: false },
  'Curl martillo': { region: 'braquial', equipment: 'dumbbell', compound: false },
  'Curl predicador': { region: 'corta', equipment: 'machine', compound: false },
  'Curl Bayesiano': { region: 'larga', equipment: 'cable', compound: false },
  // Pierna
  Sentadilla: { region: 'cuadriceps', equipment: 'barbell', compound: true },
  'Hack squat': { region: 'cuadriceps', equipment: 'machine', compound: true },
  Prensa: { region: 'cuadriceps', equipment: 'machine', compound: true },
  'Peso muerto rumano': { region: 'isquios', equipment: 'barbell', compound: true },
  'Curl femoral': { region: 'isquios', equipment: 'machine', compound: false },
  'Extensión cuádriceps': { region: 'cuadriceps', equipment: 'machine', compound: false },
  Zancadas: { region: 'accesorio', equipment: 'dumbbell', compound: true },
  'Sentadilla búlgara': { region: 'accesorio', equipment: 'dumbbell', compound: true },
  // Gemelo
  'Gemelo de pie': { region: 'gemelo', equipment: 'machine', compound: false },
  // Glúteo
  'Hip thrust': { region: 'mayor', equipment: 'barbell', compound: true },
  'Hip thrust en máquina': { region: 'mayor', equipment: 'machine', compound: true },
  'Hip thrust unilateral': { region: 'medio', equipment: 'dumbbell', compound: false },
  'Puente de glúteo': { region: 'mayor', equipment: 'bodyweight', compound: true },
  'Subida al cajón': { region: 'medio', equipment: 'dumbbell', compound: true },
  'Hiperextensión 45°': { region: 'mayor', equipment: 'bodyweight', compound: false },
  'Patada de glúteo': { region: 'medio', equipment: 'cable', compound: false },
  'Abducción de cadera': { region: 'medio', equipment: 'machine', compound: false },
  // Core
  Crunch: { region: 'recto', equipment: 'bodyweight', compound: false },
  'Elevación de piernas': { region: 'inferior', equipment: 'bodyweight', compound: false },
  'Rotación de torso': { region: 'oblicuos', equipment: 'cable', compound: false },
  Plancha: { region: 'total', equipment: 'bodyweight', compound: false },
  // Antebrazo
  'Colgarse en barra': { region: 'agarre', equipment: 'bodyweight', compound: false },
  'Curl de muñeca': { region: 'flexor', equipment: 'dumbbell', compound: false },
  'Curl inverso': { region: 'braquiorradial', equipment: 'barbell', compound: false },
  'Extensión de muñeca': { region: 'extensor', equipment: 'dumbbell', compound: false },
};

export function exerciseMeta(name: string): ExMeta | null {
  return EXERCISE_META[name] ?? null;
}

/** Ejercicios donde tu propio peso es la carga (para 1RM/volumen: peso corporal + lastre). */
const BODYWEIGHT_LOADED = new Set(['Dominadas', 'Fondos']);

export function isBodyweightLoaded(name: string): boolean {
  return BODYWEIGHT_LOADED.has(name);
}
