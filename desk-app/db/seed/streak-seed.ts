import type BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { streakTable } from '#db/schema/runtime-state';
import { DateUtils } from '#tools/date-utils';

type SqliteConnection = ReturnType<typeof BetterSqlite3>;

export function seedStreakTable(sqlite: SqliteConnection) {
  const db = drizzle(sqlite, { schema: { streakTable } });
  const firstStreakRow = db.select({ id: streakTable.id }).from(streakTable).limit(1).all()[0];
  if (firstStreakRow) return;

  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const sevenDaysBeforeMonthAgo = Array.from({ length: 7 }, (_, index) =>
    DateUtils.toDateOnlyIso(DateUtils.shiftDays(monthAgo, -(7 - index))),
  );

  const recentThreeDays = [0, -1, -2].map((offset) =>
    DateUtils.toDateOnlyIso(DateUtils.shiftDays(now, offset)),
  );
  const dates = [...new Set([...sevenDaysBeforeMonthAgo, ...recentThreeDays])];
  const rows = dates.map((date) => ({ date }));

  db.insert(streakTable).values(rows).onConflictDoNothing({ target: streakTable.date }).run();
}
