import { openDatabaseAsync, type SQLiteBindParams, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle as drizzleExpo, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { drizzle as drizzleAsync, type SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';

import * as schema from './schema';

/**
 * Versión web de `client.ts` (Metro elige este archivo al compilar para web).
 *
 * En web, expo-sqlite ejecuta SQLite (wa-sqlite, WASM) dentro de un Web Worker, y ofrece
 * dos maneras de hablar con él. La diferencia decide si esta app funciona o no:
 *
 * - **Síncrona** (la que usa el driver normal de Drizzle): manda la consulta y espera la
 *   respuesta BLOQUEANDO el hilo principal con Atomics, y recibe el resultado por un
 *   SharedArrayBuffer de **1 MiB exacto**. Eso trae dos fallos que solo aparecen con datos
 *   de verdad: con muchas consultas seguidas la interfaz no llega a pintar, y en cuanto un
 *   resultado pasa de 1 MiB se trunca y `JSON.parse` revienta con "Unterminated string".
 * - **Asíncrona**: `postMessage` normal. Sin límite de tamaño y sin bloquear nada.
 *
 * Así que en web las consultas van por la asíncrona, con el driver `sqlite-proxy` de
 * Drizzle sobre `executeForRawResultAsync`. En crudo y no con `getAllAsync` a propósito:
 * `getAllAsync` devuelve objetos por nombre de columna, y en un JOIN dos columnas que se
 * llamen igual se pisarían — datos silenciosamente mal, que es peor que un error.
 *
 * En nativo nada de esto aplica y `client.ts` sigue con el driver normal.
 */

const DB_NAME = 'momentum-v2.db';

type AppDb = SqliteRemoteDatabase<typeof schema>;

let real: {
  sqlite: SQLiteDatabase;
  db: AppDb;
  /** Instancia con el driver de expo, solo para `useMigrations` (que lo exige). */
  migrations: ExpoSQLiteDatabase<typeof schema>;
} | null = null;
let opening: Promise<void> | null = null;

/**
 * Abre la base de datos. Hay que esperarla antes de tocar `db` o `sqlite`.
 *
 * Se abre en asíncrono también por otro motivo: la primera operación síncrona tendría que
 * esperar a que se descargue el worker, compile el `.wasm` y monte el VFS sobre OPFS, y eso
 * no cabe en el margen del bloqueo — `openDatabaseSync` falla con "Sync operation timeout".
 */
export function initDb(): Promise<void> {
  opening ??= (async () => {
    const sqlite = await openDatabaseAsync(DB_NAME, { enableChangeListener: true });

    const db = drizzleAsync(
      async (sql, params, method) => {
        // Escrituras sin resultado: nada que leer, y así se evita preparar una sentencia.
        if (method === 'run') {
          await sqlite.runAsync(sql, params as SQLiteBindParams);
          return { rows: [] };
        }
        const statement = await sqlite.prepareAsync(sql);
        try {
          const executed = await statement.executeForRawResultAsync(params as SQLiteBindParams);
          const rows = (await executed.getAllAsync()) as unknown[][];
          // 'get' espera UNA fila (array de valores), no una lista de filas.
          return { rows: method === 'get' ? (rows[0] ?? []) : rows };
        } finally {
          await statement.finalizeAsync();
        }
      },
      { schema },
    );

    real = { sqlite, db, migrations: drizzleExpo(sqlite, { schema }) };
  })();
  return opening;
}

function target<K extends 'sqlite' | 'db' | 'migrations'>(key: K): NonNullable<typeof real>[K] {
  if (!real) throw new Error('La base de datos aún no está abierta: falta esperar initDb().');
  return real[key];
}

/** Reenvía al objeto real, atando los métodos a él para que `this` sea el de verdad. */
function forward<T extends object>(key: 'sqlite' | 'db' | 'migrations'): T {
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

/**
 * El tipo declarado es el de nativo (`client.ts`), porque es el que ve TypeScript: Metro
 * sustituye el módulo en tiempo de compilación, no el compilador. Las dos instancias
 * comparten la API de consultas que usa la app —select/insert/update/delete, siempre con
 * await—, así que el intercambio es seguro. Lo que NO comparten es `db.transaction()`, que
 * el driver asíncrono no implementa; por eso la app no lo usa en ningún sitio (las
 * transacciones de verdad van por `sqlite.withTransactionAsync`, en backup.ts).
 */
export const db = forward<ExpoSQLiteDatabase<typeof schema>>('db');

/** Instancia para `useMigrations`, que necesita el driver de expo. */
export const migrationsDb = forward<ExpoSQLiteDatabase<typeof schema>>('migrations');
