export type BreakLifecycleState = 'working' | 'postponed' | 'in-break';

export type BreakRuntimeState = {
  lifecycle: BreakLifecycleState;
  intervalMs: number;
  cycleStartAtIso: string | null;
  nextBreakAtIso: string | null;
  postponeCount: number;
};

export const BREAK_RUNTIME_DEFAULT_STATE: BreakRuntimeState = {
  lifecycle: 'working',
  intervalMs: 30 * 60 * 1000,
  cycleStartAtIso: null,
  nextBreakAtIso: null,
  postponeCount: 0,
};
