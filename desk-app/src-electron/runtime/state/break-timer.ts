import { BrowserWindow } from 'electron';

import type { ExerciseSettingsRuntime } from '#electron/runtime/settings/exercise';
import type { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';
import type { BreakTimerRuntimeState } from '#src/shared/state/break-timer';

function toIntervalMs(minutes: number) {
  return Math.max(1000, Math.round(minutes * 60 * 1000));
}

const POSTPONE_STEP_MIN = 5;
const POSTPONE_MAX_COUNT = 6;

export class BreakTimerRuntime {
  private state: BreakTimerRuntimeState;
  private dueTimer: NodeJS.Timeout | null = null;

  private removeBreakEveryMinChangedListener: (() => void) | null = null;

  constructor(
    private readonly exerciseSettingsRuntime: ExerciseSettingsRuntime,
    private readonly eventBus: RuntimeEventBus,
  ) {
    this.state = {
      intervalMs: toIntervalMs(this.exerciseSettingsRuntime.getState().breakEveryMin),
      cycleStartAtIso: null,
      nextBreakAtIso: null,
      postponeCount: 0,
    };
  }

  init() {
    this.removeBreakEveryMinChangedListener = this.eventBus.on(
      'exercise:breakEveryMinChanged',
      ({ current }) => {
        this.scheduleFrom(Date.now(), current);
      },
    );

    this.syncWithCurrentSettings();
  }

  destroy() {
    if (this.removeBreakEveryMinChangedListener !== null) {
      this.removeBreakEveryMinChangedListener();
      this.removeBreakEveryMinChangedListener = null;
    }
    this.clearDueTimer();
  }

  getState(): BreakTimerRuntimeState {
    return { ...this.state };
  }

  syncWithCurrentSettings(): BreakTimerRuntimeState {
    return this.scheduleFrom(Date.now(), this.exerciseSettingsRuntime.getState().breakEveryMin);
  }

  takeBreak(): BreakTimerRuntimeState {
    return this.scheduleFrom(Date.now(), this.exerciseSettingsRuntime.getState().breakEveryMin);
  }

  canPostponeBreak(): boolean {
    return this.state.postponeCount < POSTPONE_MAX_COUNT;
  }

  postponeByMinutes(minutes: number = POSTPONE_STEP_MIN): BreakTimerRuntimeState {
    if (!this.canPostponeBreak()) return this.getState();

    const postponeMs = Math.max(1, Math.round(minutes)) * 60 * 1000;
    const nowMs = Date.now();
    const nextBreakMs = this.state.nextBreakAtIso
      ? new Date(this.state.nextBreakAtIso).getTime()
      : nowMs;
    const safeBaseMs = Number.isFinite(nextBreakMs) ? Math.max(nowMs, nextBreakMs) : nowMs;

    this.state = {
      ...this.state,
      nextBreakAtIso: new Date(safeBaseMs + postponeMs).toISOString(),
      postponeCount: this.state.postponeCount + 1,
    };

    this.broadcastState();
    this.scheduleDueEvent();
    return this.getState();
  }

  private scheduleFrom(baseTimeMs: number, breakEveryMin: number): BreakTimerRuntimeState {
    const intervalMs = toIntervalMs(breakEveryMin);
    const cycleStartAtIso = new Date(baseTimeMs).toISOString();
    const nextBreakAtIso = new Date(baseTimeMs + intervalMs).toISOString();

    this.state = {
      intervalMs,
      cycleStartAtIso,
      nextBreakAtIso,
      postponeCount: 0,
    };

    this.broadcastState();
    this.scheduleDueEvent();
    return this.getState();
  }

  private scheduleDueEvent() {
    this.clearDueTimer();

    const nextBreakAtIso = this.state.nextBreakAtIso;
    if (!nextBreakAtIso) return;

    const nextBreakAtMs = new Date(nextBreakAtIso).getTime();
    if (!Number.isFinite(nextBreakAtMs)) return;

    const delayMs = Math.max(0, nextBreakAtMs - Date.now());
    this.dueTimer = setTimeout(() => {
      this.dueTimer = null;
      this.eventBus.emit('break-timer:break-due', {
        dueAtIso: nextBreakAtIso,
      });
    }, delayMs);
  }

  private clearDueTimer() {
    if (this.dueTimer !== null) {
      clearTimeout(this.dueTimer);
      this.dueTimer = null;
    }
  }

  private broadcastState() {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('dv:breakTimer:changed', this.state);
      }
    }
  }
}
