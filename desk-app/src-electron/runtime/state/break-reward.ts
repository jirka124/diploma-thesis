import { eq } from 'drizzle-orm';

import { breakRewardStateTable } from '#db/schema/runtime-state';
import type { RuntimeStateStore } from '#electron/runtime/runtime-state-store';
import type { ExerciseSettingsState } from '#src/shared/settings/exercise';
import type { BreakCycleState } from '#src/shared/state/break-runtime';
import {
  calculateBreakReward,
  computeBreakRewardPreview,
  type BreakRewardPreview,
} from '#src/shared/state/break-reward';

export class BreakRewardRuntime {
  private carryCredits = 0;
  private activeSession: { preview: BreakRewardPreview; workTimeSec: number } | null = null;

  constructor(private readonly stateStore: RuntimeStateStore) {}

  init() {
    const row = this.stateStore
      .getDb()
      .select({ carryCredits: breakRewardStateTable.carryCredits })
      .from(breakRewardStateTable)
      .where(eq(breakRewardStateTable.id, 1))
      .get();
    this.carryCredits = Math.max(0, row?.carryCredits ?? 0);
  }

  getPreview(cycleState: BreakCycleState, settings: ExerciseSettingsState) {
    return this.activeSession?.preview ?? this.computePreview(cycleState, settings);
  }

  startSession(cycleState: BreakCycleState, settings: ExerciseSettingsState) {
    const preview = this.computePreview(cycleState, settings);
    const cycleStartMs = cycleState.cycleStartAtIso
      ? new Date(cycleState.cycleStartAtIso).getTime()
      : Date.now();
    const elapsedMs = Number.isFinite(cycleStartMs)
      ? Math.max(0, Math.min(Date.now() - cycleStartMs, preview.effectiveIntervalMs))
      : 0;

    this.activeSession = {
      preview,
      workTimeSec: Math.round(Math.max(0, elapsedMs - cycleState.postponeMs) / 1000),
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
      carryCredits: this.carryCredits,
      eligibleCredits: Math.floor((preview?.earnedCycleCredits ?? 0) * completionRatio),
      completedExercises,
    });

    this.carryCredits = reward.carryCredits;
    this.persistCarryCredits();
    const result = {
      trophies: reward.trophies,
      coins: reward.coins,
      exerciseCount: reward.exerciseCount,
      workTimeSec: activeSession?.workTimeSec ?? 0,
    };
    this.activeSession = null;
    return result;
  }

  private computePreview(cycleState: BreakCycleState, settings: ExerciseSettingsState) {
    return computeBreakRewardPreview({
      intervalMs: cycleState.intervalMs,
      postponeMs: cycleState.postponeMs,
      cycleStartAtIso: cycleState.cycleStartAtIso,
      exercisesPerBreak: settings.exercisesPerBreak,
      carryCredits: this.carryCredits,
    });
  }

  private persistCarryCredits() {
    this.stateStore
      .getDb()
      .insert(breakRewardStateTable)
      .values({
        id: 1,
        carryCredits: this.carryCredits,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: breakRewardStateTable.id,
        set: {
          carryCredits: this.carryCredits,
          updatedAt: new Date().toISOString(),
        },
      })
      .run();
  }
}
