import { eq } from 'drizzle-orm';

import { breakRewardStateTable } from '#db/schema/runtime-state';
import type { RuntimeStateStore } from '#electron/runtime/runtime-state-store';
import type { ExerciseSettingsState } from '#src/shared/settings/exercise';
import type { BreakCycleState } from '#src/shared/state/break-runtime';
import {
  calculateBreakReward,
  computeCoinRewardPreview,
  computeBreakRewardPreview,
  type BreakCoinRewardPreview,
  type BreakRewardPreview,
} from '#src/shared/state/break-reward';

export class BreakRewardRuntime {
  private trophyCarryCredits = 0;
  private coinCarryCredits = 0;
  private activeSession: {
    preview: BreakRewardPreview;
    workTimeSec: number;
    postponeTimeSec: number;
  } | null = null;

  constructor(private readonly stateStore: RuntimeStateStore) {}

  init() {
    const row = this.stateStore
      .getDb()
      .select({
        trophyCarryCredits: breakRewardStateTable.trophyCarryCredits,
        coinCarryCredits: breakRewardStateTable.coinCarryCredits,
      })
      .from(breakRewardStateTable)
      .where(eq(breakRewardStateTable.id, 1))
      .get();
    this.trophyCarryCredits = Math.max(0, row?.trophyCarryCredits ?? 0);
    this.coinCarryCredits = Math.max(0, row?.coinCarryCredits ?? 0);
  }

  getPreview(cycleState: BreakCycleState, settings: ExerciseSettingsState) {
    if (this.activeSession) return this.activeSession.preview;

    const nowMs = Date.now();
    return this.computePreview(
      cycleState,
      settings,
      this.getCurrentPostponeMs(cycleState, nowMs),
      nowMs,
    );
  }

  getCoinPreview(
    cycleState: BreakCycleState,
    settings: ExerciseSettingsState,
    completedExercises: number,
    plannedExercises: number,
  ): BreakCoinRewardPreview {
    const workTimeSec = this.activeSession?.workTimeSec
      ?? this.getCurrentWorkTimeSec(cycleState, Date.now());
    return computeCoinRewardPreview({
      coinCarryCredits: this.coinCarryCredits,
      completedExercises,
      plannedExercises: plannedExercises || settings.exercisesPerBreak,
      workTimeSec,
    });
  }

  startSession(cycleState: BreakCycleState, settings: ExerciseSettingsState, startedAtMs: number) {
    const cycleStartMs = cycleState.cycleStartAtIso
      ? new Date(cycleState.cycleStartAtIso).getTime()
      : startedAtMs;
    const elapsedMs = Number.isFinite(cycleStartMs)
      ? Math.max(0, startedAtMs - cycleStartMs)
      : 0;
    const postponeMs = Math.max(0, elapsedMs - cycleState.intervalMs);
    const preview = this.computePreview(cycleState, settings, postponeMs, startedAtMs);

    this.activeSession = {
      preview,
      workTimeSec: Math.round(Math.min(elapsedMs, cycleState.intervalMs) / 1000),
      postponeTimeSec: Math.round(postponeMs / 1000),
    };
    return preview;
  }

  cancelSession() {
    this.activeSession = null;
  }

  finishSession(completedExercises: number, plannedExercises: number) {
    const activeSession = this.activeSession;
    const preview = activeSession?.preview;
    const completionRatio = plannedExercises > 0
      ? Math.min(1, Math.max(0, completedExercises / plannedExercises))
      : 0;
    const reward = calculateBreakReward({
      carryCredits: this.trophyCarryCredits,
      eligibleCredits: Math.floor((preview?.earnedCycleCredits ?? 0) * completionRatio),
      coinCarryCredits: this.coinCarryCredits,
      completedExercises,
      workTimeSec: activeSession?.workTimeSec ?? 0,
    });

    this.trophyCarryCredits = reward.carryCredits;
    this.coinCarryCredits = reward.coinCarryCredits;
    this.persistCredits();
    const result = {
      trophies: reward.trophies,
      coins: reward.coins,
      exerciseCount: reward.exerciseCount,
      workTimeSec: activeSession?.workTimeSec ?? 0,
      postponeTimeSec: activeSession?.postponeTimeSec ?? 0,
    };
    this.activeSession = null;
    return result;
  }

  private computePreview(
    cycleState: BreakCycleState,
    settings: ExerciseSettingsState,
    postponeMs = cycleState.postponeMs,
    nowMs?: number,
  ) {
    return computeBreakRewardPreview({
      intervalMs: cycleState.intervalMs,
      postponeMs,
      cycleStartAtIso: cycleState.cycleStartAtIso,
      exercisesPerBreak: settings.exercisesPerBreak,
      carryCredits: this.trophyCarryCredits,
      ...(nowMs === undefined ? {} : { nowMs }),
    });
  }

  private getCurrentWorkTimeSec(cycleState: BreakCycleState, nowMs: number) {
    const elapsedMs = this.getElapsedMs(cycleState, nowMs);
    return Math.round(Math.min(elapsedMs, cycleState.intervalMs) / 1000);
  }

  private getCurrentPostponeMs(cycleState: BreakCycleState, nowMs: number) {
    return Math.max(0, this.getElapsedMs(cycleState, nowMs) - cycleState.intervalMs);
  }

  private getElapsedMs(cycleState: BreakCycleState, nowMs: number) {
    const cycleStartMs = cycleState.cycleStartAtIso
      ? new Date(cycleState.cycleStartAtIso).getTime()
      : nowMs;
    return Number.isFinite(cycleStartMs) ? Math.max(0, nowMs - cycleStartMs) : 0;
  }

  private persistCredits() {
    this.stateStore
      .getDb()
      .insert(breakRewardStateTable)
      .values({
        id: 1,
        trophyCarryCredits: this.trophyCarryCredits,
        coinCarryCredits: this.coinCarryCredits,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: breakRewardStateTable.id,
        set: {
          trophyCarryCredits: this.trophyCarryCredits,
          coinCarryCredits: this.coinCarryCredits,
          updatedAt: new Date().toISOString(),
        },
      })
      .run();
  }
}
