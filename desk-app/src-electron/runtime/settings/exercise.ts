import { BrowserWindow } from 'electron';

import type { ExerciseSettingsState } from '#src/shared/settings/exercise';
import type { RuntimeConfigStore } from '#electron/runtime/runtime-config-store';

export class ExerciseSettingsRuntime {
  constructor(private readonly configStore: RuntimeConfigStore) {}

  getState(): ExerciseSettingsState {
    return this.configStore.get().settings.exercise;
  }

  setBreakEveryMin(breakEveryMin: ExerciseSettingsState['breakEveryMin']): ExerciseSettingsState {
    return this.commit({
      ...this.getState(),
      breakEveryMin,
    });
  }

  setExercisesPerBreak(
    exercisesPerBreak: ExerciseSettingsState['exercisesPerBreak'],
  ): ExerciseSettingsState {
    return this.commit({
      ...this.getState(),
      exercisesPerBreak,
    });
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
