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
  'Press inclinado con barra': { region: 'superior', equipment: 'barbell', compound: true },
  'Press banca': { region: 'medio', equipment: 'barbell', compound: true },
  'Press plano mancuerna': { region: 'medio', equipment: 'dumbbell', compound: true },
  Aperturas: { region: 'estiramiento', equipment: 'dumbbell', compound: false },
  Fondos: { region: 'inferior', equipment: 'bodyweight', compound: true },
  'Cruces en polea': { region: 'estiramiento', equipment: 'cable', compound: false },
  'Press de pecho en máquina': { region: 'medio', equipment: 'machine', compound: true },
  'Contractora de pecho': { region: 'estiramiento', equipment: 'machine', compound: false },
  'Press cruzado en polea': { region: 'contraccion', equipment: 'cable', compound: false },
  'Press declinado': { region: 'inferior', equipment: 'barbell', compound: true },
  'Press Larson': { region: 'medio', equipment: 'barbell', compound: true },
  // Hombro
  'Press militar': { region: 'anterior', equipment: 'dumbbell', compound: true },
  'Press Arnold': { region: 'anterior', equipment: 'dumbbell', compound: true },
  'Elevación en Y en polea': { region: 'lateral', equipment: 'cable', compound: false },
  'Elevaciones laterales': { region: 'lateral', equipment: 'dumbbell', compound: false },
  'Elevación frontal con disco': { region: 'anterior', equipment: 'dumbbell', compound: false },
  'Elevación lateral inclinada': { region: 'lateral', equipment: 'dumbbell', compound: false },
  'Elevación lateral en máquina': { region: 'lateral', equipment: 'machine', compound: false },
  'Cruce inverso en polea': { region: 'posterior', equipment: 'cable', compound: false },
  'Remo al mentón': { region: 'lateral', equipment: 'cable', compound: false },
  Pájaros: { region: 'posterior', equipment: 'dumbbell', compound: false },
  'Press hombro en máquina': { region: 'anterior', equipment: 'machine', compound: true },
  'Press militar con barra': { region: 'anterior', equipment: 'barbell', compound: true },
  'Elevaciones laterales en polea': { region: 'lateral', equipment: 'cable', compound: false },
  'Aperturas inversas': { region: 'posterior', equipment: 'machine', compound: false },
  // Tríceps
  'Press francés': { region: 'lateral-media', equipment: 'barbell', compound: false },
  'Press cerrado en banca': { region: 'lateral-media', equipment: 'barbell', compound: true },
  'Extensión tríceps polea': { region: 'lateral-media', equipment: 'cable', compound: false },
  'Extensión tríceps sobre la cabeza': { region: 'larga', equipment: 'cable', compound: false },
  'Patada de tríceps': { region: 'aislamiento', equipment: 'dumbbell', compound: false },
  'Extensión tríceps unilateral': { region: 'larga', equipment: 'dumbbell', compound: false },
  'Flexiones diamante': { region: 'lateral-media', equipment: 'bodyweight', compound: false },
  // Espalda
  'Jalón al pecho': { region: 'vertical', equipment: 'cable', compound: true },
  'Jalón unilateral arrodillado': { region: 'vertical', equipment: 'cable', compound: false },
  'Remo mancuerna': { region: 'horizontal', equipment: 'dumbbell', compound: true },
  'Remo barra': { region: 'horizontal', equipment: 'barbell', compound: true },
  'Remo Pendlay': { region: 'horizontal', equipment: 'barbell', compound: true },
  Dominadas: { region: 'vertical', equipment: 'bodyweight', compound: true },
  'Remo Gironda': { region: 'dorsal-bajo', equipment: 'cable', compound: true },
  'Remo en máquina': { region: 'horizontal', equipment: 'machine', compound: true },
  'Remo croc': { region: 'horizontal', equipment: 'dumbbell', compound: true },
  'Remo Meadows': { region: 'horizontal', equipment: 'barbell', compound: true },
  'Remo invertido': { region: 'horizontal', equipment: 'bodyweight', compound: true },
  Pullover: { region: 'dorsal-bajo', equipment: 'dumbbell', compound: false },
  'Pullover en polea': { region: 'dorsal-bajo', equipment: 'cable', compound: false },
  'Encogimiento de hombros': { region: 'trapecio', equipment: 'dumbbell', compound: false },
  'Encogimiento en polea': { region: 'trapecio', equipment: 'cable', compound: false },
  'Face pull': { region: 'posterior', equipment: 'cable', compound: false },
  'Encogimientos de Kelso': { region: 'trapecio', equipment: 'cable', compound: false },
  'Dominadas escapulares': { region: 'trapecio', equipment: 'bodyweight', compound: false },
  // Bíceps
  'Curl bíceps': { region: 'corta', equipment: 'dumbbell', compound: false },
  'Curl inclinado': { region: 'larga', equipment: 'dumbbell', compound: false },
  'Curl concentrado': { region: 'corta', equipment: 'dumbbell', compound: false },
  'Curl martillo': { region: 'braquial', equipment: 'dumbbell', compound: false },
  'Curl martillo en predicador': { region: 'braquial', equipment: 'machine', compound: false },
  'Curl tumbado': { region: 'larga', equipment: 'dumbbell', compound: false },
  'Curl Zottman inverso': { region: 'braquial', equipment: 'dumbbell', compound: false },
  'Curl en polea': { region: 'corta', equipment: 'cable', compound: false },
  'Curl predicador': { region: 'corta', equipment: 'machine', compound: false },
  'Curl con barra Z': { region: 'corta', equipment: 'barbell', compound: false },
  'Curl Bayesiano': { region: 'larga', equipment: 'cable', compound: false },
  'Curl overhead en polea': { region: 'larga', equipment: 'cable', compound: false },
  // Pierna
  Sentadilla: { region: 'cuadriceps', equipment: 'barbell', compound: true },
  'Sentadilla con pausa': { region: 'cuadriceps', equipment: 'barbell', compound: true },
  'Hack squat': { region: 'cuadriceps', equipment: 'machine', compound: true },
  'Sentadilla frontal': { region: 'cuadriceps', equipment: 'barbell', compound: true },
  'Sentadilla pendular': { region: 'cuadriceps', equipment: 'machine', compound: true },
  'Sentadilla en Smith': { region: 'cuadriceps', equipment: 'machine', compound: true },
  'Nórdico inverso': { region: 'cuadriceps', equipment: 'bodyweight', compound: false },
  Prensa: { region: 'cuadriceps', equipment: 'machine', compound: true },
  'Peso muerto rumano': { region: 'isquios', equipment: 'barbell', compound: true },
  'Peso muerto': { region: 'isquios', equipment: 'barbell', compound: true },
  'Peso muerto con barra trap': { region: 'cuadriceps', equipment: 'barbell', compound: true },
  'Peso muerto piernas rígidas': { region: 'isquios', equipment: 'barbell', compound: true },
  'Curl nórdico': { region: 'isquios', equipment: 'bodyweight', compound: false },
  'Curl femoral': { region: 'isquios', equipment: 'machine', compound: false },
  'Curl femoral sentado': { region: 'isquios', equipment: 'machine', compound: false },
  'Extensión cuádriceps': { region: 'cuadriceps', equipment: 'machine', compound: false },
  Zancadas: { region: 'accesorio', equipment: 'dumbbell', compound: true },
  'Sentadilla búlgara': { region: 'accesorio', equipment: 'dumbbell', compound: true },
  // Gemelo
  'Gemelo de pie': { region: 'gemelo', equipment: 'machine', compound: false },
  'Gemelo en prensa': { region: 'gemelo', equipment: 'machine', compound: false },
  'Gemelo sentado': { region: 'soleo', equipment: 'machine', compound: false },
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
  'Crunch declinado': { region: 'recto', equipment: 'bodyweight', compound: false },
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
