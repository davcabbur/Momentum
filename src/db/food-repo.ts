import { asc, eq } from 'drizzle-orm';

import { db } from './client';
import { foodEntry } from './schema';

export type FoodEntry = typeof foodEntry.$inferSelect;

export async function addFoodEntry(e: {
  date: string;
  name: string;
  grams: number | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode?: string | null;
}): Promise<void> {
  await db.insert(foodEntry).values({ ...e, barcode: e.barcode ?? null });
}

export async function listFoodEntries(date: string): Promise<FoodEntry[]> {
  return db.select().from(foodEntry).where(eq(foodEntry.date, date)).orderBy(asc(foodEntry.id));
}

export async function deleteFoodEntry(id: number): Promise<void> {
  await db.delete(foodEntry).where(eq(foodEntry.id, id));
}
