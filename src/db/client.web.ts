import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import * as schema from './schema';

/**
 * Versión web de `client.ts` (Metro elige este archivo al compilar para web).
 *
 * El motivo de que exista: en web, expo-sqlite ejecuta SQLite (wa-sqlite, WASM) dentro
 * de un Web Worker, y las operaciones síncronas — las únicas que usa el driver de
 * Drizzle — esperan la respuesta del worker bloqueando el hilo principal con
 * Atomics.wait, con un número máximo de vueltas. La PRIMERA llamada tiene que esperar
 * además a que el worker se descargue, compile el .wasm y monte el VFS sobre OPFS: eso
 * no cabe en ese margen y `openDatabaseSync` revienta con "Sync operation timeout".
 *
 * Así que aquí se abre la base de datos de forma asíncrona (`initDb()`, que la app
 * espera al arrancar) y, ya con el worker caliente, las operaciones síncronas de
 * Drizzle van sobradas de tiempo.
 *
 * `db` y `sqlite` siguen siendo exportaciones normales para que los repositorios no se
 * enteren de nada: son proxies que reenvían al objeto real en cuanto existe.
 */

const DB_NAME = 'momentum-v2.db';

let real: { sqlite: SQLiteDatabase; db: ExpoSQLiteDatabase<typeof schema> } | null = null;
let opening: Promise<void> | null = null;

/**
 * Abre la base de datos. Hay que esperarla antes de tocar `db` o `sqlite`.
 * Es idempotente: llamarla más veces devuelve la misma promesa.
 */
export function initDb(): Promise<void> {
  opening ??= (async () => {
    const sqlite = await openDatabaseAsync(DB_NAME, { enableChangeListener: true });
    real = { sqlite, db: drizzle(sqlite, { schema }) };
  })();
  return opening;
}

function target<K extends 'sqlite' | 'db'>(key: K): NonNullable<typeof real>[K] {
  if (!real) throw new Error('La base de datos aún no está abierta: falta esperar initDb().');
  return real[key];
}

/** Reenvía al objeto real, atando los métodos a él para que `this` sea el de verdad. */
function forward<T extends object>(key: 'sqlite' | 'db'): T {
  return new Proxy({} as T, {
    get(_t, prop) {
      const owner = target(key) as unknown as Record<string | symbol, unknown>;
      const value = owner[prop];
      return typeof value === 'function' ? value.bind(owner) : value;
    },
    has: (_t, prop) => prop in (target(key) as object),
    getPrototypeOf: () => Object.getPrototypeOf(target(key)),
  });
}

export const sqlite = forward<SQLiteDatabase>('sqlite');
export const db = forward<ExpoSQLiteDatabase<typeof schema>>('db');
