import { computePotentialHealthIndex } from 'src/shared/state/health-index';

export const TROPHY_CREDITS_PER_TROPHY = 1_000;
export const TROPHY_CREDITS_PER_30_MIN = 10 * TROPHY_CREDITS_PER_TROPHY;
export const COIN_CREDITS_PER_COIN = 1_000;
export const COIN_FULL_REWARD_WORK_SEC = 30 * 60;

export type BreakReward = {
  trophies: number;
  coins: number;
  exerciseCount: number;
};

export type BreakRewardPreview = {
  currentTrophies: number;
  maxTrophies: number;
  currentCredits: number;
  maxCredits: number;
  earnedCycleCredits: number;
  maxCycleCredits: number;
  potentialHealthIndex: number;
  effectiveIntervalMs: number;
};

export type BreakCoinRewardPreview = {
  currentCoins: number;
  maxCoins: number;
  currentCoinCredits: number;
  maxCoinCredits: number;
};

export type BreakRewardPreviewInput = {
  intervalMs: number;
  postponeMs: number;
  cycleStartAtIso: string | null;
  exercisesPerBreak: number;
  carryCredits: number;
  nowMs?: number;
};

export function computeBreakRewardPreview(input: BreakRewardPreviewInput): BreakRewardPreview {
  const intervalMs = Math.max(1, input.intervalMs);
  const postponeMs = Math.max(0, input.postponeMs);
  const effectiveIntervalMs = intervalMs + postponeMs;
  const effectiveIntervalMin = effectiveIntervalMs / 60_000;
  const potentialHealthIndex = computePotentialHealthIndex({
    breakEveryMin: effectiveIntervalMin,
    exercisesPerBreak: Math.max(0, input.exercisesPerBreak),
  });
  const healthMultiplier = potentialHealthIndex / 100;
  const maxCycleCredits = Math.floor(
    (TROPHY_CREDITS_PER_30_MIN * effectiveIntervalMs * healthMultiplier) / (30 * 60_000),
  );
  const cycleStartMs = input.cycleStartAtIso ? new Date(input.cycleStartAtIso).getTime() : NaN;
  const elapsedMs = Number.isFinite(cycleStartMs)
    ? Math.max(0, (input.nowMs ?? Date.now()) - cycleStartMs)
    : 0;
  const earnedCycleCredits = Math.floor(
    (TROPHY_CREDITS_PER_30_MIN * Math.min(elapsedMs, effectiveIntervalMs) * healthMultiplier) /
      (30 * 60_000),
  );
  const carryCredits = Math.max(0, Math.floor(input.carryCredits));
  const currentCredits = carryCredits + earnedCycleCredits;
  const maxCredits = carryCredits + maxCycleCredits;

  return {
    currentTrophies: Math.floor(currentCredits / TROPHY_CREDITS_PER_TROPHY),
    maxTrophies: Math.floor(maxCredits / TROPHY_CREDITS_PER_TROPHY),
    currentCredits,
    maxCredits,
    earnedCycleCredits,
    maxCycleCredits,
    potentialHealthIndex,
    effectiveIntervalMs,
  };
}

function computeCoinCredits(completedExercises: number, workTimeSec: number) {
  const safeExerciseCount = Math.max(0, Math.floor(completedExercises));
  const baseCoins = safeExerciseCount <= 0 ? 0 : 3 + Math.min(safeExerciseCount - 1, 2);
  const workRatio = Math.min(1, Math.max(0, workTimeSec) / COIN_FULL_REWARD_WORK_SEC);
  return Math.floor(baseCoins * workRatio * COIN_CREDITS_PER_COIN);
}

export function computeCoinRewardPreview(input: {
  coinCarryCredits: number;
  completedExercises: number;
  plannedExercises: number;
  workTimeSec: number;
}): BreakCoinRewardPreview {
  const carryCredits = Math.max(0, Math.floor(input.coinCarryCredits));
  const currentCoinCredits = carryCredits + computeCoinCredits(
    input.completedExercises,
    input.workTimeSec,
  );
  const maxCoinCredits = carryCredits + computeCoinCredits(
    input.plannedExercises,
    input.workTimeSec,
  );

  return {
    currentCoins: Math.floor(currentCoinCredits / COIN_CREDITS_PER_COIN),
    maxCoins: Math.floor(maxCoinCredits / COIN_CREDITS_PER_COIN),
    currentCoinCredits,
    maxCoinCredits,
  };
}

export function calculateBreakReward(input: {
  eligibleCredits: number;
  carryCredits: number;
  coinCarryCredits: number;
  completedExercises: number;
  workTimeSec: number;
}): BreakReward & { carryCredits: number; coinCarryCredits: number } {
  const totalCredits = Math.max(0, Math.floor(input.carryCredits + input.eligibleCredits));
  const safeExerciseCount = Math.max(0, Math.floor(input.completedExercises));
  const earnedCoinCredits = computeCoinCredits(safeExerciseCount, input.workTimeSec);
  const totalCoinCredits = Math.max(
    0,
    Math.floor(input.coinCarryCredits) + earnedCoinCredits,
  );

  return {
    trophies: Math.floor(totalCredits / TROPHY_CREDITS_PER_TROPHY),
    coins: Math.floor(totalCoinCredits / COIN_CREDITS_PER_COIN),
    exerciseCount: safeExerciseCount,
    carryCredits: totalCredits % TROPHY_CREDITS_PER_TROPHY,
    coinCarryCredits: totalCoinCredits % COIN_CREDITS_PER_COIN,
  };
}
