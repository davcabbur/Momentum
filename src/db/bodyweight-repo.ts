import { eq, inArray } from 'drizzle-orm';

import { db } from './client';
import { bodyweightEntry, userProfile, weightGoal } from './schema';

export type Profile = typeof userProfile.$inferSelect;

export async function getProfile(): Promise<Profile | null> {
  const rows = await db.select().from(userProfile).limit(1);
  return rows[0] ?? null;
}

export async function setProfile(p: {
  sex: string;
  age: number;
  stage: string;
  activityLevel: string;
}): Promise<void> {
  const current = await getProfile();
  if (current) {
    await db.update(userProfile).set(p).where(eq(userProfile.id, current.id));
  } else {
    await db.insert(userProfile).values(p);
  }
}

/** Inserta o actualiza el pesaje de un día (único por fecha). */
export async function upsertWeight(date: string, weightKg: number): Promise<void> {
  const existing = await db.select().from(bodyweightEntry).where(eq(bodyweightEntry.date, date));
  if (existing.length > 0) {
    await db.update(bodyweightEntry).set({ weightKg }).where(eq(bodyweightEntry.date, date));
  } else {
    await db.insert(bodyweightEntry).values({ date, weightKg });
  }
}

export async function deleteWeight(date: string): Promise<void> {
  await db.delete(bodyweightEntry).where(eq(bodyweightEntry.date, date));
}

export async function deleteWeights(dates: string[]): Promise<void> {
  if (dates.length === 0) return;
  await db.delete(bodyweightEntry).where(inArray(bodyweightEntry.date, dates));
}

export async function listWeights(): Promise<{ date: string; weightKg: number }[]> {
  const rows = await db.select().from(bodyweightEntry);
  return rows.map((r) => ({ date: r.date, weightKg: r.weightKg }));
}

export async function getGoal(): Promise<typeof weightGoal.$inferSelect | null> {
  const rows = await db.select().from(weightGoal).limit(1);
  return rows[0] ?? null;
}

export async function setGoal(targetKg: number, startKg: number, startDate: string): Promise<void> {
  const current = await getGoal();
  if (current) {
    await db.update(weightGoal).set({ targetKg, startKg, startDate }).where(eq(weightGoal.id, current.id));
  } else {
    await db.insert(weightGoal).values({ targetKg, startKg, startDate });
  }
}

export async function clearGoal(): Promise<void> {
  await db.delete(weightGoal);
}
