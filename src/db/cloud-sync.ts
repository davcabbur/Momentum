import { supabase } from '@/lib/supabase';
import { listWeights } from './bodyweight-repo';
import { exportData, importData } from './backup';

const TABLE = 'user_snapshot';

/** ¿Hay algo que merezca la pena en local? (criterio simple: hay pesajes registrados). */
export async function localHasData(): Promise<boolean> {
  return (await listWeights()).length > 0;
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
}

/** Baja la copia de la cuenta y la restaura en local. Devuelve false si la cuenta no tenía datos. */
export async function pullSnapshot(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data?.data) return false;
  await importData(JSON.stringify(data.data));
  return true;
}
