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
});

/**
 * Perfil del usuario. sex/age se usarán para el cálculo de kcal (fase C, Mifflin-St Jeor);
 * stage = etapa (definicion/normocalorica/volumen); activityLevel = nivel de actividad.
 */
export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sex: text('sex').notNull(), // 'male' | 'female'
  age: integer('age').notNull(),
  stage: text('stage').notNull(), // 'definicion' | 'normocalorica' | 'volumen'
  activityLevel: text('activity_level').notNull(), // 'sedentary'|'light'|'moderate'|'high'|'very_high'
});

// Nota de producto: no existe ningún campo de IMC, ni se calculará. Ver CLAUDE.md.
