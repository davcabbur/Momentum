import { eq } from 'drizzle-orm';

import { db } from './client';
import { appSetting } from './schema';

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSetting).where(eq(appSetting.key, key));
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(appSetting).where(eq(appSetting.key, key));
  if (existing[0]) await db.update(appSetting).set({ value }).where(eq(appSetting.key, key));
  else await db.insert(appSetting).values({ key, value });
}
