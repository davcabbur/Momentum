import { sqlite } from './client';

/** Tablas que se incluyen en la copia (padres antes que hijas). */
const TABLES = [
  'bodyweight_entry',
  'weight_goal',
  'user_profile',
  'exercise',
  'routine',
  'routine_day',
  'routine_day_exercise',
  'workout_session',
  'set_log',
  'food_entry',
  'app_setting',
  'food_product',
  'activity_day',
];

export interface Backup {
  app: 'momentum';
  version: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

/** Vuelca toda la base de datos a un JSON (string) para guardarlo como copia. */
export async function exportData(): Promise<string> {
  const tables: Backup['tables'] = {};
  for (const t of TABLES) {
    tables[t] = (await sqlite.getAllAsync(`SELECT * FROM ${t}`)) as Record<string, unknown>[];
  }
  const backup: Backup = { app: 'momentum', version: 1, exportedAt: new Date().toISOString(), tables };
  return JSON.stringify(backup);
}

/** Borra TODOS los datos locales del usuario (todas las tablas). Irreversible. */
export async function clearAllData(): Promise<void> {
  await sqlite.withTransactionAsync(async () => {
    for (const t of TABLES) {
      await sqlite.runAsync(`DELETE FROM ${t}`);
    }
  });
}

/**
 * Restaura una copia: reemplaza el contenido de cada tabla por el del archivo.
 * Es destructivo (borra lo actual). Devuelve cuántas filas se importaron.
 */
export async function importData(json: string): Promise<{ rows: number }> {
  let data: Backup;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!data || data.app !== 'momentum' || typeof data.tables !== 'object') {
    throw new Error('El archivo no es una copia de Momentum válida.');
  }
  let rows = 0;
  await sqlite.withTransactionAsync(async () => {
    for (const t of TABLES) {
      const list = data.tables[t];
      if (!Array.isArray(list)) continue;
      await sqlite.runAsync(`DELETE FROM ${t}`);
      for (const row of list) {
        const cols = Object.keys(row);
        if (cols.length === 0) continue;
        const placeholders = cols.map(() => '?').join(', ');
        const sql = `INSERT INTO ${t} (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
        await sqlite.runAsync(sql, cols.map((c) => row[c] as never));
        rows++;
      }
    }
  });
  return { rows };
}
