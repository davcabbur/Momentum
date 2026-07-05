import { supabase } from '@/lib/supabase';
import { db } from './client';
import { bodyweightEntry, foodEntry, userProfile, workoutSession } from './schema';
import { exportData, importData } from './backup';
import { getSetting, setSetting } from './settings-repo';

const TABLE = 'user_snapshot';
const LAST_SYNC_KEY = 'last_sync_at';

/** Marca ISO de la última sincronización (subida o bajada) hecha en este móvil. */
export async function getLastSync(): Promise<string | null> {
  return getSetting(LAST_SYNC_KEY);
}

/**
 * ¿Hay algo que merezca la pena en local? Cuenta cualquier dato del usuario
 * (peso, comida, entrenos o perfil), no solo los pesajes: así nunca sobrescribimos
 * en silencio datos locales con una copia antigua de la nube al iniciar sesión.
 */
export async function localHasData(): Promise<boolean> {
  const tables = [bodyweightEntry, foodEntry, workoutSession, userProfile];
  for (const t of tables) {
    const rows = await db.select({ id: t.id }).from(t).limit(1);
    if (rows.length > 0) return true;
  }
  return false;
}

export async function getRemoteMeta(userId: string): Promise<{ exists: boolean; updatedAt: string | null }> {
  const { data, error } = await supabase.from(TABLE).select('updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return { exists: !!data, updatedAt: data?.updated_at ?? null };
}

/** Sube la copia completa de la BD local a la cuenta del usuario. */
export async function pushSnapshot(userId: string): Promise<void> {
  const json = await exportData();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: JSON.parse(json), updated_at: new Date().toISOString() });
  if (error) throw error;
  await setSetting(LAST_SYNC_KEY, new Date().toISOString());
}

/** Baja la copia de la cuenta y la restaura en local. Devuelve false si la cuenta no tenía datos. */
export async function pullSnapshot(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data?.data) return false;
  await importData(JSON.stringify(data.data));
  await setSetting(LAST_SYNC_KEY, new Date().toISOString());
  return true;
}
