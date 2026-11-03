import { BrowserWindow } from 'electron';

import type { ExerciseSettingsRuntime } from '#electron/runtime/settings/exercise';
import type { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';
import type { BreakRuntimeState } from '#src/shared/state/break-runtime';

function toIntervalMs(minutes: number) {
  return Math.max(1000, Math.round(minutes * 60 * 1000));
}

const POSTPONE_STEP_MIN = 5;
const POSTPONE_MAX_COUNT = 6;

export class BreakRuntime {
  private state: BreakRuntimeState;
  private dueTimer: NodeJS.Timeout | null = null;
  private removeBreakEveryMinChangedListener: (() => void) | null = null;
  private removeBreakSessionStartedListener: (() => void) | null = null;
  private removeBreakSessionCanceledListener: (() => void) | null = null;
  private removeBreakSessionFinishedListener: (() => void) | null = null;

  constructor(
    private readonly exerciseSettingsRuntime: ExerciseSettingsRuntime,
    private readonly eventBus: RuntimeEventBus,
  ) {
    this.state = {
      lifecycle: 'working',
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
        if (this.state.lifecycle === 'in-break') {
          this.state = { ...this.state, intervalMs: toIntervalMs(current) };
          this.broadcastState();
          return;
        }
        this.scheduleWorkingCycle(Date.now(), current);
      },
    );
    this.removeBreakSessionStartedListener = this.eventBus.on('break-session:started', () => {
      this.enterBreak();
    });
    this.removeBreakSessionCanceledListener = this.eventBus.on('break-session:canceled', () => {
      this.scheduleWorkingCycle(Date.now(), this.exerciseSettingsRuntime.getState().breakEveryMin);
    });
    this.removeBreakSessionFinishedListener = this.eventBus.on('break-session:finished', () => {
      this.scheduleWorkingCycle(Date.now(), this.exerciseSettingsRuntime.getState().breakEveryMin);
    });

    this.syncWithCurrentSettings();
  }

  destroy() {
    this.removeBreakEveryMinChangedListener?.();
    this.removeBreakSessionStartedListener?.();
    this.removeBreakSessionCanceledListener?.();
    this.removeBreakSessionFinishedListener?.();
    this.removeBreakEveryMinChangedListener = null;
    this.removeBreakSessionStartedListener = null;
    this.removeBreakSessionCanceledListener = null;
    this.removeBreakSessionFinishedListener = null;
    this.clearDueTimer();
  }

  getState(): BreakRuntimeState {
    return { ...this.state };
  }

  syncWithCurrentSettings(): BreakRuntimeState {
    return this.scheduleWorkingCycle(Date.now(), this.exerciseSettingsRuntime.getState().breakEveryMin);
  }

  canPostponeBreak(): boolean {
    return this.state.lifecycle !== 'in-break' && this.state.postponeCount < POSTPONE_MAX_COUNT;
  }

  postponeByMinutes(minutes: number = POSTPONE_STEP_MIN): BreakRuntimeState {
    if (!this.canPostponeBreak()) return this.getState();

    const postponeMs = Math.max(1, Math.round(minutes)) * 60 * 1000;
    const nowMs = Date.now();
    const nextBreakMs = this.state.nextBreakAtIso
      ? new Date(this.state.nextBreakAtIso).getTime()
      : nowMs;
    const safeBaseMs = Number.isFinite(nextBreakMs) ? Math.max(nowMs, nextBreakMs) : nowMs;

    this.state = {
      ...this.state,
      lifecycle: 'postponed',
      nextBreakAtIso: new Date(safeBaseMs + postponeMs).toISOString(),
      postponeCount: this.state.postponeCount + 1,
    };

    this.broadcastState();
    this.scheduleDueEvent();
    return this.getState();
  }

  private enterBreak() {
    this.clearDueTimer();
    this.state = {
      ...this.state,
      lifecycle: 'in-break',
      nextBreakAtIso: null,
    };
    this.broadcastState();
  }

  private scheduleWorkingCycle(baseTimeMs: number, breakEveryMin: number): BreakRuntimeState {
    const intervalMs = toIntervalMs(breakEveryMin);
    const cycleStartAtIso = new Date(baseTimeMs).toISOString();
    const nextBreakAtIso = new Date(baseTimeMs + intervalMs).toISOString();

    this.state = {
      lifecycle: 'working',
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
      this.eventBus.emit('break:due', { dueAtIso: nextBreakAtIso });
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
      if (!win.isDestroyed()) win.webContents.send('dv:break:changed', this.state);
    }
  }
}
