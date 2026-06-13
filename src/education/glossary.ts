export interface GlossaryTerm {
  key: string;
  title: string;
  body: string;
}

/** Glosario educativo: lenguaje de entrenador explicado en llano. */
export const GLOSSARY: GlossaryTerm[] = [
  {
    key: 'rir',
    title: 'RIR (repeticiones en reserva)',
    body: 'Cuántas repeticiones te quedan antes del fallo. RIR 2 = podrías hacer 2 más. En hipertrofia se suele entrenar entre RIR 0 y 3.',
  },
  {
    key: 'rpe',
    title: 'RPE (esfuerzo percibido)',
    body: 'Escala de 1 a 10 de lo dura que sientes una serie. RPE 8 ≈ RIR 2. Es el "primo" del RIR.',
  },
  {
    key: 'topset',
    title: 'Top set',
    body: 'La serie más pesada/dura de un ejercicio, normalmente la primera cuando estás fresco.',
  },
  {
    key: 'backoff',
    title: 'Back-off',
    body: 'Series con algo menos de peso que la top set, para acumular volumen con buena técnica.',
  },
  {
    key: 'deload',
    title: 'Deload',
    body: 'Semana más suave (menos peso o volumen) para recuperar fatiga acumulada y seguir progresando después.',
  },
  {
    key: '1rm',
    title: '1RM estimado',
    body: 'El peso máximo que levantarías 1 vez, estimado a partir de tus series (peso × reps). Sirve para ver tu fuerza sin probar el máximo real.',
  },
  {
    key: 'doble',
    title: 'Doble progresión',
    body: 'Primero subes repeticiones dentro de un rango (p. ej. 8→12); cuando llegas al tope en todas las series, subes el peso y vuelves al extremo bajo.',
  },
  {
    key: 'sobrecarga',
    title: 'Sobrecarga progresiva',
    body: 'Hacer el entreno un poco más difícil con el tiempo (más reps, más peso o mejor técnica). Es la base para no estancarse.',
  },
  {
    key: 'tendencia',
    title: 'Tendencia de peso',
    body: 'La línea suavizada de tu peso corporal. Importa más que el número de un día, que sube y baja por agua, comida o sal.',
  },
  {
    key: 'hipertrofia',
    title: 'Hipertrofia vs fuerza',
    body: 'Hipertrofia = hacer crecer el músculo (6–12 reps). Fuerza = levantar el máximo posible (1–5 reps). La mayoría entrenamos para hipertrofia.',
  },
  {
    key: 'volumen-entreno',
    title: 'Volumen de entrenamiento',
    body: 'El trabajo total de un músculo, normalmente en series por semana. Ni muy poco (no creces) ni demasiado (no recuperas).',
  },
  {
    key: 'fallo',
    title: 'Fallo muscular vs técnico',
    body: 'Muscular = el músculo no puede más. Técnico = se rompe la técnica. Evita el técnico (riesgo de lesión); acércate al muscular con control.',
  },
  {
    key: 'etapas',
    title: 'Etapas: definición / normocalórica / volumen',
    body: 'Definición = comer menos para perder grasa. Volumen = comer más para ganar músculo. Normocalórica/recomp = mantenerte y mejorar poco a poco.',
  },
  {
    key: 'tdee',
    title: 'Mantenimiento (TDEE)',
    body: 'Las calorías que gastas al día en total. Comer alrededor de tu TDEE mantiene tu peso; por debajo, bajas; por encima, subes.',
  },
  {
    key: 'deficit',
    title: 'Déficit y superávit',
    body: 'Déficit = comer menos que tu mantenimiento (para perder grasa). Superávit = comer más (para ganar músculo). Mejor moderados y sostenibles.',
  },
  {
    key: 'proteina',
    title: 'Proteína',
    body: 'El macronutriente que construye y protege el músculo. Conviene tomarla alta (≈1,8–2,2 g por kg de peso) y repartida en el día, sobre todo en déficit.',
  },
];
