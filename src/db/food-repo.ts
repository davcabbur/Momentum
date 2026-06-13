import { asc, eq } from 'drizzle-orm';

import type { Macros } from '@/nutrition/macros';
import { db } from './client';
import { foodEntry, foodProduct } from './schema';

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

/** Caché de productos escaneados: lee uno por código de barras. */
export async function getCachedProduct(barcode: string): Promise<{ name: string; per100: Macros } | null> {
  const rows = await db.select().from(foodProduct).where(eq(foodProduct.barcode, barcode));
  const p = rows[0];
  if (!p) return null;
  return { name: p.name, per100: { kcal: p.kcal100, protein: p.protein100, carbs: p.carbs100, fat: p.fat100 } };
}

/** Guarda (o actualiza) un producto en la caché local. */
export async function cacheProduct(barcode: string, name: string, per100: Macros): Promise<void> {
  const existing = await db.select().from(foodProduct).where(eq(foodProduct.barcode, barcode));
  const vals = { name, kcal100: per100.kcal, protein100: per100.protein, carbs100: per100.carbs, fat100: per100.fat };
  if (existing[0]) await db.update(foodProduct).set(vals).where(eq(foodProduct.barcode, barcode));
  else await db.insert(foodProduct).values({ barcode, ...vals });
}
