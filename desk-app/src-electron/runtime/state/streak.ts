import { BrowserWindow } from 'electron';
import { desc } from 'drizzle-orm';

import { streakTable } from '#db/schema/runtime-state';
import type { RuntimeStateStore } from '#electron/runtime/runtime-state-store';
import {
  STREAK_QUICK_STATUS_DEFAULT_STATE,
  type StreakQuickStatusState,
} from '#src/shared/state/streak';
import { DateUtils } from '#tools/date-utils';

export class StreakRuntime {
  constructor(private readonly stateStore: RuntimeStateStore) {}

  getState(): StreakQuickStatusState {
    const db = this.stateStore.getDb();
    const rows = db
      .select({ date: streakTable.date })
      .from(streakTable)
      .orderBy(desc(streakTable.date))
      .all();

    const latest = rows[0];
    if (!latest) return { ...STREAK_QUICK_STATUS_DEFAULT_STATE };

    const latestDate = latest.date;
    let streakDays = 1;

    for (let i = 1; i < rows.length; i += 1) {
      const prevRow = rows[i - 1];
      const currentRow = rows[i];
      if (!prevRow || !currentRow) break;

      const prevDay = DateUtils.dateOnlyToUtcDaySerial(prevRow.date);
      const currentDay = DateUtils.dateOnlyToUtcDaySerial(currentRow.date);
      const dayDiff = prevDay - currentDay;

      if (dayDiff !== 1) break;
      streakDays += 1;
    }

    return {
      currentStreakDays: streakDays,
      lastTrackedDate: latestDate,
    };
  }

  tryTrackToday(): StreakQuickStatusState {
    const db = this.stateStore.getDb();
    const today = DateUtils.toDateOnlyIso(new Date());

    const result = db
      .insert(streakTable)
      .values({ date: today })
      .onConflictDoNothing({ target: streakTable.date })
      .run() as { changes?: number };

    const state = this.getState();
    const inserted = (result?.changes ?? 0) > 0;
    if (inserted) this.broadcast(state);

    return state;
  }

  private broadcast(state: StreakQuickStatusState) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('dv:streak:changed', state);
      }
    }
  }
}
