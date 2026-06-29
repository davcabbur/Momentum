import { asc, eq, gte } from 'drizzle-orm';

import type { DaySteps } from '@/activity/steps';
import { db } from './client';
import { activityDay } from './schema';
import { getSetting, setSetting } from './settings-repo';

const STEPS_GOAL_KEY = 'steps_goal';
const DEFAULT_GOAL = 8000;

export async function upsertActivityDay(date: string, steps: number, source: 'health_connect' | 'manual'): Promise<void> {
  const existing = await db.select({ id: activityDay.id }).from(activityDay).where(eq(activityDay.date, date));
  if (existing[0]) {
    await db.update(activityDay).set({ steps, source }).where(eq(activityDay.id, existing[0].id));
  } else {
    await db.insert(activityDay).values({ date, steps, source });
  }
}

export async function listActivityDays(fromDate: string): Promise<DaySteps[]> {
  const rows = await db
    .select({ date: activityDay.date, steps: activityDay.steps })
    .from(activityDay)
    .where(gte(activityDay.date, fromDate))
    .orderBy(asc(activityDay.date));
  return rows;
}

export async function getStepsGoal(): Promise<number> {
  const v = await getSetting(STEPS_GOAL_KEY);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOAL;
}

export async function setStepsGoal(goal: number): Promise<void> {
  await setSetting(STEPS_GOAL_KEY, String(Math.round(goal)));
}
