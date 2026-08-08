import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

import * as schema from './schema';

// v2: archivo nuevo para forzar una BD limpia tras los cambios de esquema en desarrollo.
export const sqlite = openDatabaseSync('momentum-v2.db', { enableChangeListener: true });
export const db = drizzle(sqlite, { schema });

/**
 * En nativo la BD ya está abierta al importar este módulo, así que no hay nada que
 * esperar. Existe para que la app arranque igual en las dos plataformas: en web
 * (`client.web.ts`) esto sí abre la base de datos, y hace falta.
 */
export function initDb(): Promise<void> {
  return Promise.resolve();
}
