import { BrowserWindow } from 'electron';

import type { ExerciseRuntime } from '#electron/runtime/state/exercise-runtime';
import type { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';
import type {
  BreakSessionExercise,
  BreakSessionState,
} from '#src/shared/state/break-session';
import { BREAK_SESSION_DEFAULT_STATE } from '#src/shared/state/break-session';

const RUNTIME_TICK_MS = 50;

export class BreakSessionRuntime {
  private state: BreakSessionState = { ...BREAK_SESSION_DEFAULT_STATE };
  private tickTimer: NodeJS.Timeout | null = null;
  private lastTickAtMs: number | null = null;

  constructor(
    private readonly exerciseRuntime: ExerciseRuntime,
    private readonly eventBus: RuntimeEventBus,
  ) {}

  destroy() {
    this.stopTicking();
  }

  getState(): BreakSessionState {
    return {
      ...this.state,
      exercises: this.state.exercises.map((exercise) => ({
        ...exercise,
        instructions: [...exercise.instructions],
      })),
    };
  }

  startSession(): BreakSessionState {
    if (this.state.status === 'running' || this.state.status === 'paused') return this.getState();

    const exercises: BreakSessionExercise[] = this.exerciseRuntime
      .takeUpcomingPlan()
      .map((exercise, index) => ({
        ...exercise,
        instructions: [...exercise.instructions],
        status: index === 0 ? 'running' : 'pending',
      }));
    const nowIso = new Date().toISOString();

    this.state = {
      status: 'running',
      startedAtIso: nowIso,
      pausedAtIso: null,
      endedAtIso: null,
      currentExerciseIndex: 0,
      exerciseRunTimestamp: 0,
      exercises,
      updatedAtIso: nowIso,
    };

    this.startTicking();
    this.eventBus.emit('break-session:started', {
      startedAtIso: nowIso,
    });
    this.broadcastState();
    return this.getState();
  }

  pauseSession(): BreakSessionState {
    if (this.state.status !== 'running') return this.getState();

    this.state = {
      ...this.state,
      status: 'paused',
      pausedAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
    };

    this.stopTicking();
    this.broadcastState();
    return this.getState();
  }

  resumeSession(): BreakSessionState {
    if (this.state.status !== 'paused') return this.getState();

    const currentExercise = this.state.exercises[this.state.currentExerciseIndex];
    if (!currentExercise) return this.getState();

    this.state = {
      ...this.state,
      status: 'running',
      pausedAtIso: null,
      updatedAtIso: new Date().toISOString(),
    };

    this.startTicking();
    this.broadcastState();
    return this.getState();
  }

  skipExercise(): BreakSessionState {
    if (this.state.status !== 'running' && this.state.status !== 'paused') return this.getState();
    if (this.state.currentExerciseIndex < 0) return this.getState();

    const currentExercise = this.state.exercises[this.state.currentExerciseIndex];
    if (!currentExercise) return this.getState();

    const nextExercises: BreakSessionExercise[] = this.state.exercises.map((exercise, index) => {
      if (index === this.state.currentExerciseIndex) {
        return {
          ...exercise,
          status: exercise.status === 'done' ? 'done' : 'skipped',
        };
      }
      return exercise;
    });

    this.state = {
      ...this.state,
      exercises: nextExercises,
      updatedAtIso: new Date().toISOString(),
    };

    this.advanceToNextExercise();
    this.broadcastState();
    return this.getState();
  }

  cancelSession(): BreakSessionState {
    if (this.state.status !== 'running' && this.state.status !== 'paused') return this.getState();
    const canceledAtIso = new Date().toISOString();

    this.state = {
      ...this.state,
      status: 'canceled',
      endedAtIso: canceledAtIso,
      updatedAtIso: canceledAtIso,
    };

    this.stopTicking();
    this.eventBus.emit('break-session:canceled', {
      canceledAtIso,
    });
    this.broadcastState();
    return this.getState();
  }

  private startTicking() {
    this.stopTicking();
    this.lastTickAtMs = Date.now();
    this.tickTimer = setInterval(() => {
      this.handleTick();
    }, RUNTIME_TICK_MS);
  }

  private stopTicking() {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.lastTickAtMs = null;
  }

  private handleTick() {
    if (this.state.status !== 'running') return;
    if (this.state.currentExerciseIndex < 0) return;

    const currentExercise = this.state.exercises[this.state.currentExerciseIndex];
    if (!currentExercise) return;

    const nowMs = Date.now();
    const previousTickMs = this.lastTickAtMs ?? nowMs;
    const deltaMs = Math.max(0, nowMs - previousTickMs);
    this.lastTickAtMs = nowMs;

    const nextRunTimestamp = this.state.exerciseRunTimestamp + deltaMs;
    if (nextRunTimestamp < currentExercise.durationMs) {
      this.state = {
        ...this.state,
        exerciseRunTimestamp: nextRunTimestamp,
        updatedAtIso: new Date(nowMs).toISOString(),
      };
      this.broadcastState();
      return;
    }

    const nextExercises: BreakSessionExercise[] = this.state.exercises.map((exercise, index) => {
      if (index === this.state.currentExerciseIndex) {
        return {
          ...exercise,
          status: 'done',
        };
      }
      return exercise;
    });

    this.state = {
      ...this.state,
      exercises: nextExercises,
      exerciseRunTimestamp: currentExercise.durationMs,
      updatedAtIso: new Date(nowMs).toISOString(),
    };

    this.advanceToNextExercise();
    this.broadcastState();
  }

  private advanceToNextExercise() {
    const nextIndex = this.state.currentExerciseIndex + 1;
    if (nextIndex >= this.state.exercises.length) {
      const finishedAtIso = new Date().toISOString();
      this.state = {
        ...this.state,
        status: 'finished',
        endedAtIso: finishedAtIso,
        updatedAtIso: finishedAtIso,
      };
      this.stopTicking();
      this.eventBus.emit('break-session:finished', {
        finishedAtIso,
      });
      return;
    }

    const nextExercises: BreakSessionExercise[] = this.state.exercises.map((exercise, index) => {
      if (index === nextIndex) {
        return {
          ...exercise,
          status: 'running',
        };
      }
      return exercise;
    });

    this.state = {
      ...this.state,
      currentExerciseIndex: nextIndex,
      exerciseRunTimestamp: 0,
      exercises: nextExercises,
      updatedAtIso: new Date().toISOString(),
    };
    this.lastTickAtMs = Date.now();
  }

  private broadcastState() {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('dv:breakSession:changed', this.state);
      }
    }
  }
}
