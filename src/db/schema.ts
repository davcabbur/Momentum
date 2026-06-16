import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

/** Pesaje diario. Único por día a nivel de aplicación. */
export const bodyweightEntry = sqliteTable('bodyweight_entry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  weightKg: real('weight_kg').notNull(),
});

/** Objetivo de peso (uno activo). */
export const weightGoal = sqliteTable('weight_goal', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  targetKg: real('target_kg').notNull(),
  startKg: real('start_kg').notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  targetDate: text('target_date'), // YYYY-MM-DD (nullable por compatibilidad)
});

/**
 * Perfil del usuario. sex/age se usarán para el cálculo de kcal (fase C, Mifflin-St Jeor);
 * stage = etapa (definicion/normocalorica/volumen); activityLevel = nivel de actividad.
 */
export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sex: text('sex').notNull(), // 'male' | 'female'
  age: integer('age').notNull(),
  heightCm: integer('height_cm'), // nullable: ALTER ADD en tabla con filas no admite NOT NULL sin default
  stage: text('stage').notNull(), // 'definicion' | 'normocalorica' | 'volumen'
  activityLevel: text('activity_level').notNull(), // 'sedentary'|'light'|'moderate'|'high'|'very_high'
  level: text('level'), // 'principiante'|'intermedio'|'avanzado' (nullable)
});

/** Ejercicio (catálogo inicial + creados por el usuario). */
export const exercise = sqliteTable('exercise', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(), // pecho, espalda, pierna, hombro, biceps, triceps, gemelo, core, otro
  pattern: text('pattern').notNull(), // empuje | tiron | pierna | otro
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
});

export const routine = sqliteTable('routine', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const routineDay = sqliteTable('routine_day', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineId: integer('routine_id').notNull(),
  name: text('name').notNull(),
  orderIdx: integer('order_idx').notNull(),
});

export const routineDayExercise = sqliteTable('routine_day_exercise', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineDayId: integer('routine_day_id').notNull(),
  exerciseId: integer('exercise_id').notNull(),
  orderIdx: integer('order_idx').notNull(),
  targetSets: integer('target_sets'), // series objetivo (override del nivel; nullable)
  repMin: integer('rep_min'),
  repMax: integer('rep_max'),
});

export const workoutSession = sqliteTable('workout_session', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  routineDayId: integer('routine_day_id').notNull(),
  note: text('note'), // nota libre de la sesión (nullable)
});

export const setLog = sqliteTable('set_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  exerciseId: integer('exercise_id').notNull(),
  setNumber: integer('set_number').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  rir: integer('rir'), // nullable
  setType: text('set_type').notNull().default('normal'), // warmup | top | backoff | normal
});

/** Alimento registrado en un día (fase B). Guarda los valores de la ración consumida. */
export const foodEntry = sqliteTable('food_entry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  name: text('name').notNull(),
  grams: real('grams'), // ración en gramos (nullable)
  kcal: real('kcal').notNull(),
  protein: real('protein').notNull(),
  carbs: real('carbs').notNull(),
  fat: real('fat').notNull(),
  barcode: text('barcode'), // código de barras si vino del escáner (nullable)
});

/** Caché local de productos escaneados (Open Food Facts) para reusarlos offline. */
export const foodProduct = sqliteTable('food_product', {
  barcode: text('barcode').primaryKey(),
  name: text('name').notNull(),
  kcal100: real('kcal100').notNull(),
  protein100: real('protein100').notNull(),
  carbs100: real('carbs100').notNull(),
  fat100: real('fat100').notNull(),
});

// Nota de producto: no existe ningún campo de IMC, ni se calculará. Ver CLAUDE.md.
