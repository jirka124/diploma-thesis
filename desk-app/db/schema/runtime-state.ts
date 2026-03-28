import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const testTable = sqliteTable('test', {
  id: integer('id').primaryKey(),
  label: text('label').notNull(),
  updatedAt: text('updated_at').notNull(),
});
