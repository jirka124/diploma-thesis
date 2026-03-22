import { BrowserWindow } from 'electron';

import { type ThemeState } from '../../../src/shared/settings/theme';
import type { RuntimeConfigStore } from '../runtime-config-store';

export class ThemeRuntime {
  constructor(private readonly configStore: RuntimeConfigStore) {}

  getState(): ThemeState {
    return this.configStore.get().settings.theme;
  }

  setMode(mode: ThemeState['mode']): ThemeState {
    const next = {
      ...this.getState(),
      mode,
    };

    return this.commit(next);
  }

  setAccent(accent: ThemeState['accent']): ThemeState {
    const next = {
      ...this.getState(),
      accent,
    };

    return this.commit(next);
  }

  private commit(next: ThemeState): ThemeState {
    const currentSettings = this.configStore.get().settings;
    const state = this.configStore.patch({
      settings: {
        ...currentSettings,
        theme: next,
      },
    }).settings.theme;
    this.broadcast(state);
    return state;
  }

  private broadcast(state: ThemeState) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('dv:theme:changed', state);
      }
    }
  }
}
