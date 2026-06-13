import type { ImageSourcePropType } from 'react-native';

/**
 * Mapa de imágenes empaquetadas por nombre de ejercicio.
 * Imágenes de free-exercise-db (dominio público / Unlicense), en assets/exercises/.
 * React Native exige require() estático, por eso el mapa es explícito.
 * Tres ejercicios muy específicos (Encogimientos de Kelso, Curl Bayesiano,
 * Colgarse en barra) no tienen equivalente en el banco → muestran placeholder.
 */
const IMAGES: Record<string, ImageSourcePropType> = {
  'Press inclinado': require('../../assets/exercises/press_inclinado.jpg'),
  'Press banca': require('../../assets/exercises/press_banca.jpg'),
  'Press plano mancuerna': require('../../assets/exercises/press_plano_mancuerna.jpg'),
  Aperturas: require('../../assets/exercises/aperturas.jpg'),
  Fondos: require('../../assets/exercises/fondos.jpg'),
  'Cruces en polea': require('../../assets/exercises/cruces_en_polea.jpg'),
  'Press declinado': require('../../assets/exercises/press_declinado.jpg'),
  'Press militar': require('../../assets/exercises/press_militar.jpg'),
  'Elevaciones laterales': require('../../assets/exercises/elevaciones_laterales.jpg'),
  Pájaros: require('../../assets/exercises/pajaros.jpg'),
  'Press hombro en máquina': require('../../assets/exercises/press_hombro_en_maquina.jpg'),
  'Press militar con barra': require('../../assets/exercises/press_militar_con_barra.jpg'),
  'Elevaciones laterales en polea': require('../../assets/exercises/elevaciones_laterales_en_polea.jpg'),
  'Aperturas inversas': require('../../assets/exercises/aperturas_inversas.jpg'),
  'Press francés': require('../../assets/exercises/press_frances.jpg'),
  'Extensión tríceps polea': require('../../assets/exercises/extension_triceps_polea.jpg'),
  'Extensión tríceps sobre la cabeza': require('../../assets/exercises/extension_triceps_sobre_la_cabeza.jpg'),
  'Patada de tríceps': require('../../assets/exercises/patada_de_triceps.jpg'),
  'Extensión tríceps unilateral': require('../../assets/exercises/extension_triceps_unilateral.jpg'),
  'Jalón al pecho': require('../../assets/exercises/jalon_al_pecho.jpg'),
  'Remo mancuerna': require('../../assets/exercises/remo_mancuerna.jpg'),
  'Remo barra': require('../../assets/exercises/remo_barra.jpg'),
  Dominadas: require('../../assets/exercises/dominadas.jpg'),
  'Remo Gironda': require('../../assets/exercises/remo_gironda.jpg'),
  Pullover: require('../../assets/exercises/pullover.jpg'),
  'Encogimiento de hombros': require('../../assets/exercises/encogimiento_de_hombros.jpg'),
  'Face pull': require('../../assets/exercises/face_pull.jpg'),
  'Dominadas escapulares': require('../../assets/exercises/dominadas_escapulares.jpg'),
  'Curl bíceps': require('../../assets/exercises/curl_biceps.jpg'),
  'Curl inclinado': require('../../assets/exercises/curl_inclinado.jpg'),
  'Curl concentrado': require('../../assets/exercises/curl_concentrado.jpg'),
  'Curl martillo': require('../../assets/exercises/curl_martillo.jpg'),
  'Curl predicador': require('../../assets/exercises/curl_predicador.jpg'),
  Sentadilla: require('../../assets/exercises/sentadilla.jpg'),
  'Hack squat': require('../../assets/exercises/hack_squat.jpg'),
  Prensa: require('../../assets/exercises/prensa.jpg'),
  'Peso muerto rumano': require('../../assets/exercises/peso_muerto_rumano.jpg'),
  'Curl femoral': require('../../assets/exercises/curl_femoral.jpg'),
  'Extensión cuádriceps': require('../../assets/exercises/extension_cuadriceps.jpg'),
  Zancadas: require('../../assets/exercises/zancadas.jpg'),
  'Sentadilla búlgara': require('../../assets/exercises/sentadilla_bulgara.jpg'),
  'Gemelo de pie': require('../../assets/exercises/gemelo_de_pie.jpg'),
  'Hip thrust': require('../../assets/exercises/hip_thrust.jpg'),
  'Puente de glúteo': require('../../assets/exercises/puente_de_gluteo.jpg'),
  'Patada de glúteo': require('../../assets/exercises/patada_de_gluteo.jpg'),
  'Abducción de cadera': require('../../assets/exercises/abduccion_de_cadera.jpg'),
  Crunch: require('../../assets/exercises/crunch.jpg'),
  'Elevación de piernas': require('../../assets/exercises/elevacion_de_piernas.jpg'),
  'Rotación de torso': require('../../assets/exercises/rotacion_de_torso.jpg'),
  Plancha: require('../../assets/exercises/plancha.jpg'),
  'Curl de muñeca': require('../../assets/exercises/curl_de_muneca.jpg'),
  'Curl inverso': require('../../assets/exercises/curl_inverso.jpg'),
  'Extensión de muñeca': require('../../assets/exercises/extension_de_muneca.jpg'),
};

export function exerciseImage(name: string): ImageSourcePropType | null {
  return IMAGES[name] ?? null;
}
