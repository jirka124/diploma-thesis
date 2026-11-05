import type { ExerciseSettingsRuntime } from '#electron/runtime/settings/exercise';
import type { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';
import type { BreakCycleState } from '#src/shared/state/break-runtime';

function toIntervalMs(minutes: number) {
  return Math.max(1000, Math.round(minutes * 60 * 1000));
}

const POSTPONE_STEP_MIN = 5;
const POSTPONE_MAX_COUNT = 6;

export class BreakCycleRuntime {
  private state: BreakCycleState;
  private dueTimer: NodeJS.Timeout | null = null;
  private removeBreakEveryMinChangedListener: (() => void) | null = null;
  private readonly changedListeners = new Set<() => void>();

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
      postponeMs: 0,
    };
  }

  init() {
    this.removeBreakEveryMinChangedListener = this.eventBus.on(
      'exercise:breakEveryMinChanged',
      ({ current }) => {
        if (this.state.lifecycle === 'in-break') {
          this.state = { ...this.state, intervalMs: toIntervalMs(current) };
          this.notifyChanged();
          return;
        }
        this.scheduleWorkingCycle(Date.now(), current);
      },
    );
    this.syncWithCurrentSettings();
  }

  destroy() {
    this.removeBreakEveryMinChangedListener?.();
    this.removeBreakEveryMinChangedListener = null;
    this.clearDueTimer();
    this.changedListeners.clear();
  }

  onChanged(listener: () => void) {
    this.changedListeners.add(listener);
    return () => this.changedListeners.delete(listener);
  }

  getState(): BreakCycleState {
    return { ...this.state };
  }

  syncWithCurrentSettings(): BreakCycleState {
    return this.scheduleWorkingCycle(Date.now(), this.exerciseSettingsRuntime.getState().breakEveryMin);
  }

  startNextCycle(): BreakCycleState {
    return this.scheduleWorkingCycle(Date.now(), this.exerciseSettingsRuntime.getState().breakEveryMin);
  }

  canPostponeBreak(): boolean {
    return this.state.lifecycle !== 'in-break' && this.state.postponeCount < POSTPONE_MAX_COUNT;
  }

  postponeByMinutes(minutes: number = POSTPONE_STEP_MIN): BreakCycleState {
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
      postponeMs: this.state.postponeMs + postponeMs,
    };

    this.notifyChanged();
    this.scheduleDueEvent();
    return this.getState();
  }

  enterBreak() {
    this.clearDueTimer();
    this.state = {
      ...this.state,
      lifecycle: 'in-break',
      nextBreakAtIso: null,
    };
    this.notifyChanged();
  }

  private scheduleWorkingCycle(baseTimeMs: number, breakEveryMin: number): BreakCycleState {
    const intervalMs = toIntervalMs(breakEveryMin);
    const cycleStartAtIso = new Date(baseTimeMs).toISOString();
    const nextBreakAtIso = new Date(baseTimeMs + intervalMs).toISOString();

    this.state = {
      lifecycle: 'working',
      intervalMs,
      cycleStartAtIso,
      nextBreakAtIso,
      postponeCount: 0,
      postponeMs: 0,
    };

    this.notifyChanged();
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

  private notifyChanged() {
    for (const listener of this.changedListeners) listener();
  }
}

