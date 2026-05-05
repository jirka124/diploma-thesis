import { BrowserWindow } from 'electron';

import type { ExerciseSettingsState } from '#src/shared/settings/exercise';
import type { RuntimeConfigStore } from '#electron/runtime/runtime-config-store';
import type { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';

export class ExerciseSettingsRuntime {
  constructor(
    private readonly configStore: RuntimeConfigStore,
    private readonly eventBus: RuntimeEventBus,
  ) {}

  getState(): ExerciseSettingsState {
    return this.configStore.get().settings.exercise;
  }

  setBreakEveryMin(breakEveryMin: ExerciseSettingsState['breakEveryMin']): ExerciseSettingsState {
    const previous = this.getState().breakEveryMin;
    const state = this.commit({
      ...this.getState(),
      breakEveryMin,
    });

    if (state.breakEveryMin !== previous) {
      this.eventBus.emit('exercise:breakEveryMinChanged', {
        previous,
        current: state.breakEveryMin,
      });
    }

    return state;
  }

  setExercisesPerBreak(
    exercisesPerBreak: ExerciseSettingsState['exercisesPerBreak'],
  ): ExerciseSettingsState {
    const previous = this.getState().exercisesPerBreak;
    const state = this.commit({
      ...this.getState(),
      exercisesPerBreak,
    });

    if (state.exercisesPerBreak !== previous) {
      this.eventBus.emit('exercise:exercisesPerBreakChanged', {
        previous,
        current: state.exercisesPerBreak,
      });
    }

    return state;
  }

  private commit(next: ExerciseSettingsState): ExerciseSettingsState {
    const currentSettings = this.configStore.get().settings;
    const state = this.configStore.patch({
      settings: {
        ...currentSettings,
        exercise: next,
      },
    }).settings.exercise;

    this.broadcast(state);
    return state;
  }

  private broadcast(state: ExerciseSettingsState) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('dv:exercise:changed', state);
      }
    }
  }
}
