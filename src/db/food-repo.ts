import { asc, eq, gte } from 'drizzle-orm';

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

/** Kcal totales por día (solo días con algo registrado), desde fromDate inclusive. */
export async function intakeByDay(fromDate: string): Promise<{ date: string; kcal: number }[]> {
  const rows = await db.select({ date: foodEntry.date, kcal: foodEntry.kcal }).from(foodEntry).where(gte(foodEntry.date, fromDate));
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.kcal);
  return [...map.entries()].map(([date, kcal]) => ({ date, kcal }));
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
