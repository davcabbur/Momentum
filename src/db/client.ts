import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

import * as schema from './schema';

// v2: archivo nuevo para forzar una BD limpia tras los cambios de esquema en desarrollo.
export const sqlite = openDatabaseSync('momentum-v2.db', { enableChangeListener: true });
export const db = drizzle(sqlite, { schema });
