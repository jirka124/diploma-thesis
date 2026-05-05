export type BreakTimerRuntimeState = {
  intervalMs: number;
  cycleStartAtIso: string | null;
  nextBreakAtIso: string | null;
  postponeCount: number;
};

export const BREAK_TIMER_DEFAULT_STATE: BreakTimerRuntimeState = {
  intervalMs: 30 * 60 * 1000,
  cycleStartAtIso: null,
  nextBreakAtIso: null,
  postponeCount: 0,
};
