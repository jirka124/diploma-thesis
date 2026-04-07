export type BreakTakenInput = {
  trophiesEarned: number;
  coinsEarned: number;
  exerciseCount: number;
  workTimeSec: number;
  postponeTimeSec: number;
  exerciseTimeSec: number;
};

export type StatisticsDateRange = {
  startDateIso?: string;
  endDateIso?: string;
};

export type BreakStatisticsState = {
  dateRange: {
    startDateIso: string | null;
    endDateIso: string | null;
  };
  breakCount: number;
  trophiesEarned: number;
  coinsEarned: number;
  exerciseCount: number;
  workTimeSec: number;
  postponeTimeSec: number;
  exerciseTimeSec: number;
};

export const BREAK_STATISTICS_DEFAULT_STATE: BreakStatisticsState = {
  dateRange: {
    startDateIso: null,
    endDateIso: null,
  },
  breakCount: 0,
  trophiesEarned: 0,
  coinsEarned: 0,
  exerciseCount: 0,
  workTimeSec: 0,
  postponeTimeSec: 0,
  exerciseTimeSec: 0,
};

function toNonNegativeInt(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function coerceBreakTakenInput(value: unknown): BreakTakenInput {
  const raw = (value ?? {}) as Partial<BreakTakenInput>;

  return {
    trophiesEarned: toNonNegativeInt(raw.trophiesEarned),
    coinsEarned: toNonNegativeInt(raw.coinsEarned),
    exerciseCount: toNonNegativeInt(raw.exerciseCount),
    workTimeSec: toNonNegativeInt(raw.workTimeSec),
    postponeTimeSec: toNonNegativeInt(raw.postponeTimeSec),
    exerciseTimeSec: toNonNegativeInt(raw.exerciseTimeSec),
  };
}

function toIsoOrUndefined(value: unknown) {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function coerceStatisticsDateRange(value: unknown): StatisticsDateRange {
  const raw = (value ?? {}) as Partial<StatisticsDateRange>;
  const startDateIso = toIsoOrUndefined(raw.startDateIso);
  const endDateIso = toIsoOrUndefined(raw.endDateIso);

  return {
    ...(startDateIso ? { startDateIso } : {}),
    ...(endDateIso ? { endDateIso } : {}),
  };
}
