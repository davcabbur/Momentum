import { computeTrend } from '@/bodyweight/trend';
import { getProfile, listWeights } from '@/db/bodyweight-repo';
import { getHistoryRows } from '@/db/workout-repo';
import { bestBig3 } from '@/ranking/lifts';
import { big3Dots, isPlausibleDots, tierForDots, type Sex } from '@/ranking/score';
import { supabase } from '@/lib/supabase';

const TABLE = 'leaderboard';
const round = (n: number) => Math.round(n * 10) / 10;

export interface MyLifts {
  squat: number;
  bench: number;
  dead: number;
  bodyweightKg: number;
  sex: Sex;
  dots: number;
  tierKey: string;
  tierName: string;
  complete: boolean; // Big 3 registrado, peso corporal y DOTS plausible
}

/** Calcula tu puntuación de ranking a partir de tus datos locales (no toca la nube). */
export async function computeMyLifts(): Promise<MyLifts | null> {
  const prof = await getProfile();
  if (!prof) return null;
  const sex: Sex = prof.sex === 'female' ? 'female' : 'male';
  const trend = computeTrend(await listWeights());
  const bw = trend.length ? trend[trend.length - 1].trendKg : 0;
  const { squat, bench, dead } = bestBig3(await getHistoryRows());
  const dots = big3Dots({ squat, bench, dead, bodyweightKg: bw, sex });
  const tier = tierForDots(dots);
  const complete = squat > 0 && bench > 0 && dead > 0 && bw > 0 && isPlausibleDots(dots);
  return { squat, bench, dead, bodyweightKg: bw, sex, dots, tierKey: tier.key, tierName: tier.name, complete };
}

export interface LeaderRow {
  userId: string;
  alias: string;
  sex: string;
  dots: number;
  tier: string;
  squat: number;
  bench: number;
  dead: number;
  bodyweightKg: number;
}

function mapRow(d: Record<string, unknown>): LeaderRow {
  return {
    userId: String(d.user_id),
    alias: String(d.alias ?? ''),
    sex: String(d.sex ?? ''),
    dots: Number(d.dots ?? 0),
    tier: String(d.tier ?? 'hierro'),
    squat: Number(d.squat_1rm ?? 0),
    bench: Number(d.bench_1rm ?? 0),
    dead: Number(d.dead_1rm ?? 0),
    bodyweightKg: Number(d.bodyweight_kg ?? 0),
  };
}

async function myId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Fila del usuario en el ranking (null si no se ha inscrito). */
export async function getMyRankingRow(): Promise<LeaderRow | null> {
  const id = await myId();
  if (!id) return null;
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', id).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

function payload(id: string, alias: string, l: MyLifts) {
  return {
    user_id: id,
    alias: alias.trim().slice(0, 24),
    sex: l.sex,
    bodyweight_kg: round(l.bodyweightKg),
    squat_1rm: round(l.squat),
    bench_1rm: round(l.bench),
    dead_1rm: round(l.dead),
    dots: l.dots,
    tier: l.tierKey,
    updated_at: new Date().toISOString(),
  };
}

/** Inscribe al usuario en el ranking con un alias (opt-in). */
export async function joinRanking(alias: string): Promise<{ error: Error | null }> {
  const id = await myId();
  const lifts = await computeMyLifts();
  if (!id) return { error: new Error('Inicia sesión para competir.') };
  if (!lifts || !lifts.complete) {
    return { error: new Error('Registra sentadilla, press banca y peso muerto (y tu peso) para puntuar.') };
  }
  if (!alias.trim()) return { error: new Error('Elige un alias.') };
  const { error } = await supabase.from(TABLE).upsert(payload(id, alias, lifts));
  return { error: (error as Error | null) ?? null };
}

/** Recalcula y sube tu puntuación si ya estás inscrito (idempotente). */
export async function refreshMyRanking(): Promise<void> {
  const mine = await getMyRankingRow();
  if (!mine) return;
  const id = await myId();
  const lifts = await computeMyLifts();
  if (!id || !lifts || !lifts.complete) return;
  await supabase.from(TABLE).update(payload(id, mine.alias, lifts)).eq('user_id', id);
}

/** Salir del ranking (borra tu fila pública). */
export async function leaveRanking(): Promise<void> {
  const id = await myId();
  if (!id) return;
  await supabase.from(TABLE).delete().eq('user_id', id);
}

/** Tabla de clasificación (de mayor a menor DOTS). */
export async function listLeaderboard(limit = 100): Promise<LeaderRow[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('dots', { ascending: false }).limit(limit);
  if (error || !data) return [];
  return data.map(mapRow);
}
