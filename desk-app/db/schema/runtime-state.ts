import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const testTable = sqliteTable('test', {
  id: integer('id').primaryKey(),
  label: text('label').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const streakTable = sqliteTable(
  'streak',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
  },
  (table) => [uniqueIndex('streak_date_unique_idx').on(table.date)],
);

export const breakTakenTable = sqliteTable('break_taken', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trophiesEarned: integer('trophies_earned').notNull(),
  coinsEarned: integer('coins_earned').notNull(),
  exerciseCount: integer('exercise_count').notNull(),
  workTimeSec: integer('work_time').notNull(),
  postponeTimeSec: integer('postpone_time').notNull(),
  exerciseTimeSec: integer('exercise_time').notNull(),
  createdAt: text('created_at').notNull(),
});
