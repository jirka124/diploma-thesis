import type { BreakCoinRewardPreview, BreakRewardPreview } from 'src/shared/state/break-reward';

export type BreakLifecycleState = 'working' | 'postponed' | 'in-break';

export type BreakCycleState = {
  lifecycle: BreakLifecycleState;
  intervalMs: number;
  cycleStartAtIso: string | null;
  nextBreakAtIso: string | null;
  postponeCount: number;
  postponeMs: number;
};

export const BREAK_CYCLE_DEFAULT_STATE: BreakCycleState = {
  lifecycle: 'working',
  intervalMs: 30 * 60 * 1000,
  cycleStartAtIso: null,
  nextBreakAtIso: null,
  postponeCount: 0,
  postponeMs: 0,
};

export type BreakRuntimeState = BreakCycleState & {
  rewardPreview: BreakRewardPreview;
  coinRewardPreview: BreakCoinRewardPreview;
};
