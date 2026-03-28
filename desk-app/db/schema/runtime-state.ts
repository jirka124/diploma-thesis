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
