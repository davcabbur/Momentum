import type { ImageSourcePropType } from 'react-native';

/**
 * Mapa de imágenes empaquetadas por nombre de ejercicio.
 * Las imágenes son de free-exercise-db (dominio público) y viven en
 * assets/exercises/. React Native exige require() estático, así que este
 * mapa se mantiene a mano / generado. Se rellena en la Fase 2.
 */
const IMAGES: Record<string, ImageSourcePropType> = {};

export function exerciseImage(name: string): ImageSourcePropType | null {
  return IMAGES[name] ?? null;
}
