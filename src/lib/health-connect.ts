import { Platform } from 'react-native';

import type { DaySteps } from '@/activity/steps';

const STEPS = 'Steps' as const;

/** ¿Hay Health Connect disponible? (solo Android e inicializable.) */
export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const { initialize } = await import('react-native-health-connect');
    return await initialize();
  } catch {
    return false;
  }
}

/** ¿Ya tenemos permiso de lectura de pasos? No abre diálogo. */
export async function hasStepsPermission(): Promise<boolean> {
  if (!(await isHealthAvailable())) return false;
  try {
    const { getGrantedPermissions } = await import('react-native-health-connect');
    const granted = await getGrantedPermissions();
    return granted.some((p) => 'recordType' in p && p.recordType === STEPS && 'accessType' in p && (p as { recordType: string; accessType: string }).accessType === 'read');
  } catch {
    return false;
  }
}

/** Pide permiso de lectura de pasos (abre el diálogo de Health Connect). */
export async function ensureStepsPermission(): Promise<boolean> {
  if (!(await isHealthAvailable())) return false;
  try {
    const { requestPermission } = await import('react-native-health-connect');
    const granted = await requestPermission([{ accessType: 'read', recordType: STEPS }]);
    return granted.some((p) => 'recordType' in p && p.recordType === STEPS && 'accessType' in p && (p as { recordType: string; accessType: string }).accessType === 'read');
  } catch {
    return false;
  }
}

/** Lee los pasos por día en el rango (inclusive), agregando registros por fecha local. */
export async function readDailySteps(fromIso: string, toIso: string): Promise<DaySteps[]> {
  if (!(await hasStepsPermission())) return [];
  const { readRecords } = await import('react-native-health-connect');
  const startTime = new Date(fromIso + 'T00:00:00').toISOString();
  const endTime = new Date(toIso + 'T23:59:59').toISOString();
  const res = await readRecords(STEPS, { timeRangeFilter: { operator: 'between', startTime, endTime } });
  const records = (res as { records: { startTime: string; count: number }[] }).records ?? [];
  const byDay = new Map<string, number>();
  for (const r of records) {
    const day = r.startTime.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + (r.count ?? 0));
  }
  return [...byDay.entries()].map(([date, steps]) => ({ date, steps })).sort((a, b) => a.date.localeCompare(b.date));
}
