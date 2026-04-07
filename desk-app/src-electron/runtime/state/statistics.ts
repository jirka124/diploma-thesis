import { BrowserWindow } from 'electron';
import { and, gte, lte } from 'drizzle-orm';

import { breakTakenTable } from '#db/schema/runtime-state';
import type { RuntimeStateStore } from '#electron/runtime/runtime-state-store';
import {
  BREAK_STATISTICS_DEFAULT_STATE,
  type BreakStatisticsState,
  type BreakTakenInput,
  type StatisticsDateRange,
} from '#src/shared/state/statistics';

type BreakTakenRow = {
  trophiesEarned: number;
  coinsEarned: number;
  exerciseCount: number;
  workTimeSec: number;
  postponeTimeSec: number;
  exerciseTimeSec: number;
};

type NormalizedDateRange = {
  startDateIso: string | null;
  endDateIso: string | null;
};

function normalizeDateRange(range?: StatisticsDateRange): NormalizedDateRange {
  const startDateIso = range?.startDateIso ?? null;
  const endDateIso = range?.endDateIso ?? null;

  if (!startDateIso || !endDateIso) {
    return {
      startDateIso,
      endDateIso,
    };
  }

  return startDateIso <= endDateIso
    ? { startDateIso, endDateIso }
    : { startDateIso: endDateIso, endDateIso: startDateIso };
}

function toState(dateRange: NormalizedDateRange, rows: BreakTakenRow[]): BreakStatisticsState {
  let breakCount = 0;
  let trophiesEarned = 0;
  let coinsEarned = 0;
  let exerciseCount = 0;
  let workTimeSec = 0;
  let postponeTimeSec = 0;
  let exerciseTimeSec = 0;

  for (const row of rows) {
    breakCount += 1;
    trophiesEarned += row.trophiesEarned;
    coinsEarned += row.coinsEarned;
    exerciseCount += row.exerciseCount;
    workTimeSec += row.workTimeSec;
    postponeTimeSec += row.postponeTimeSec;
    exerciseTimeSec += row.exerciseTimeSec;
  }

  return {
    ...BREAK_STATISTICS_DEFAULT_STATE,
    dateRange,
    breakCount,
    trophiesEarned,
    coinsEarned,
    exerciseCount,
    workTimeSec,
    postponeTimeSec,
    exerciseTimeSec,
  };
}

export class StatisticsRuntime {
  constructor(private readonly stateStore: RuntimeStateStore) {}

  getState(range?: StatisticsDateRange): BreakStatisticsState {
    const db = this.stateStore.getDb();
    const normalizedRange = normalizeDateRange(range);

    const conditions: Array<ReturnType<typeof gte>> = [];
    if (normalizedRange.startDateIso) {
      conditions.push(gte(breakTakenTable.createdAt, normalizedRange.startDateIso));
    }
    if (normalizedRange.endDateIso) {
      conditions.push(lte(breakTakenTable.createdAt, normalizedRange.endDateIso));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = db
      .select({
        trophiesEarned: breakTakenTable.trophiesEarned,
        coinsEarned: breakTakenTable.coinsEarned,
        exerciseCount: breakTakenTable.exerciseCount,
        workTimeSec: breakTakenTable.workTimeSec,
        postponeTimeSec: breakTakenTable.postponeTimeSec,
        exerciseTimeSec: breakTakenTable.exerciseTimeSec,
      })
      .from(breakTakenTable)
      .where(where)
      .all();

    return toState(normalizedRange, rows);
  }

  addBreak(input: BreakTakenInput): BreakStatisticsState {
    const db = this.stateStore.getDb();

    db.insert(breakTakenTable)
      .values({
        trophiesEarned: input.trophiesEarned,
        coinsEarned: input.coinsEarned,
        exerciseCount: input.exerciseCount,
        workTimeSec: input.workTimeSec,
        postponeTimeSec: input.postponeTimeSec,
        exerciseTimeSec: input.exerciseTimeSec,
        createdAt: new Date().toISOString(),
      })
      .run();

    const state = this.getState();
    this.broadcast(state);
    return state;
  }

  private broadcast(state: BreakStatisticsState) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('dv:statistics:changed', state);
      }
    }
  }
}
