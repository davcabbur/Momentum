import { getSetting, setSetting } from '@/db/settings-repo';
import type { Macros } from './macros';

const KEY = 'custom_macros';

/** Objetivos de kcal y macros fijados por el usuario (si los ha personalizado). */
export async function getCustomMacros(): Promise<Macros | null> {
  const raw = await getSetting(KEY);
  if (!raw) return null;
  try {
    const m = JSON.parse(raw);
    if (m && typeof m.kcal === 'number') {
      return { kcal: m.kcal, protein: m.protein ?? 0, carbs: m.carbs ?? 0, fat: m.fat ?? 0 };
    }
  } catch {
    /* json inválido */
  }
  return null;
}

/** Guarda los objetivos personalizados, o pásalo a null para volver al cálculo automático. */
export async function setCustomMacros(m: Macros | null): Promise<void> {
  await setSetting(KEY, m ? JSON.stringify(m) : '');
}
