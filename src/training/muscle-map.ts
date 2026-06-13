import type { Slug } from 'react-native-body-highlighter';

/** Vista del diagrama corporal por grupo muscular: qué músculo resaltar y qué lado mostrar. */
export interface MuscleView {
  slug: Slug;
  side: 'front' | 'back';
}

const MAP: Record<string, MuscleView> = {
  pecho: { slug: 'chest', side: 'front' },
  espalda: { slug: 'upper-back', side: 'back' },
  pierna: { slug: 'quadriceps', side: 'front' },
  hombro: { slug: 'deltoids', side: 'front' },
  biceps: { slug: 'biceps', side: 'front' },
  triceps: { slug: 'triceps', side: 'back' },
  gemelo: { slug: 'calves', side: 'back' },
  gluteo: { slug: 'gluteal', side: 'back' },
  core: { slug: 'abs', side: 'front' },
  antebrazo: { slug: 'forearm', side: 'front' },
};

export function muscleView(muscleGroup: string): MuscleView | null {
  return MAP[muscleGroup] ?? null;
}
