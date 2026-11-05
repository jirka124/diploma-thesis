import { BrowserWindow } from 'electron';

import type { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';
import type { ExerciseSettingsRuntime } from '#electron/runtime/settings/exercise';
import type { StatisticsRuntime } from '#electron/runtime/state/statistics';
import type { BreakCycleRuntime } from '#electron/runtime/state/break-cycle';
import type { BreakSessionRuntime } from '#electron/runtime/state/break-session';
import type { BreakRewardRuntime } from '#electron/runtime/state/break-reward';
import type { BreakRuntimeState } from '#src/shared/state/break-runtime';

export class BreakRuntime {
  private initialized = false;
  private previewTimer: NodeJS.Timeout | null = null;
  private removeCycleChangedListener: (() => void) | null = null;
  private removeBreakDueListener: (() => void) | null = null;
  private removeSessionStartedListener: (() => void) | null = null;
  private removeSessionCanceledListener: (() => void) | null = null;
  private removeSessionFinishedListener: (() => void) | null = null;

  constructor(
    private readonly cycleRuntime: BreakCycleRuntime,
    private readonly sessionRuntime: BreakSessionRuntime,
    private readonly rewardRuntime: BreakRewardRuntime,
    private readonly statisticsRuntime: StatisticsRuntime,
    private readonly exerciseSettingsRuntime: ExerciseSettingsRuntime,
    private readonly eventBus: RuntimeEventBus,
  ) {}

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.rewardRuntime.init();
    this.removeCycleChangedListener = this.cycleRuntime.onChanged(() => this.broadcastState());
    this.removeBreakDueListener = this.eventBus.on('break:due', () => {
      this.sessionRuntime.startSession();
    });
    this.removeSessionStartedListener = this.eventBus.on('break-session:started', () => {
      this.rewardRuntime.startSession(
        this.cycleRuntime.getState(),
        this.exerciseSettingsRuntime.getState(),
      );
      this.cycleRuntime.enterBreak();
      this.broadcastState();
    });
    this.removeSessionCanceledListener = this.eventBus.on('break-session:canceled', () => {
      this.rewardRuntime.cancelSession();
      this.cycleRuntime.startNextCycle();
    });
    this.removeSessionFinishedListener = this.eventBus.on('break-session:finished', () => {
      const sessionState = this.sessionRuntime.getState();
      const completedExercises = sessionState.exercises.filter((exercise) => exercise.status === 'done');
      const reward = this.rewardRuntime.finishSession(
        completedExercises.length,
        sessionState.exercises.length,
      );
      const cycleState = this.cycleRuntime.getState();

      this.statisticsRuntime.addBreak({
        trophiesEarned: reward.trophies,
        coinsEarned: reward.coins,
        exerciseCount: reward.exerciseCount,
        workTimeSec: reward.workTimeSec,
        postponeTimeSec: Math.round(cycleState.postponeMs / 1000),
        exerciseTimeSec: Math.round(
          completedExercises.reduce((sum, exercise) => sum + exercise.durationMs, 0) / 1000,
        ),
      });
      this.cycleRuntime.startNextCycle();
    });
    this.cycleRuntime.init();
    this.previewTimer = setInterval(() => this.broadcastState(), 1000);
    this.broadcastState();
  }

  destroy() {
    if (!this.initialized) return;
    this.removeCycleChangedListener?.();
    this.removeBreakDueListener?.();
    this.removeSessionStartedListener?.();
    this.removeSessionCanceledListener?.();
    this.removeSessionFinishedListener?.();
    this.removeCycleChangedListener = null;
    this.removeBreakDueListener = null;
    this.removeSessionStartedListener = null;
    this.removeSessionCanceledListener = null;
    this.removeSessionFinishedListener = null;
    if (this.previewTimer !== null) clearInterval(this.previewTimer);
    this.previewTimer = null;
    this.cycleRuntime.destroy();
    this.initialized = false;
  }

  getState(): BreakRuntimeState {
    const cycleState = this.cycleRuntime.getState();
    return {
      ...cycleState,
      rewardPreview: this.rewardRuntime.getPreview(cycleState, this.exerciseSettingsRuntime.getState()),
    };
  }

  canPostponeBreak() {
    return this.cycleRuntime.canPostponeBreak();
  }

  postponeByMinutes(minutes: number) {
    this.cycleRuntime.postponeByMinutes(minutes);
    return this.getState();
  }

  getSessionState() {
    return this.sessionRuntime.getState();
  }

  startSession() {
    return this.sessionRuntime.startSession();
  }

  pauseSession() {
    return this.sessionRuntime.pauseSession();
  }

  resumeSession() {
    return this.sessionRuntime.resumeSession();
  }

  skipSessionExercise() {
    return this.sessionRuntime.skipExercise();
  }

  cancelSession() {
    return this.sessionRuntime.cancelSession();
  }

  private broadcastState() {
    const state = this.getState();
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send('dv:break:changed', state);
    }
  }
}
