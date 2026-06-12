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

// Nota de producto: no existe ningún campo de IMC, ni se calculará. Ver CLAUDE.md.
