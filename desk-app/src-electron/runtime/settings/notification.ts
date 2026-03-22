import { BrowserWindow } from 'electron';

import type { NotificationSettingsState } from '../../../src/shared/settings/notification';
import type { RuntimeConfigStore } from '../runtime-config-store';

export class NotificationSettingsRuntime {
  constructor(private readonly configStore: RuntimeConfigStore) {}

  getState(): NotificationSettingsState {
    return this.configStore.get().settings.notification;
  }

  setNotificationsEnabled(
    notificationsEnabled: NotificationSettingsState['notificationsEnabled'],
  ): NotificationSettingsState {
    const currentSettings = this.configStore.get().settings;
    const state = this.configStore.patch({
      settings: {
        ...currentSettings,
        notification: { notificationsEnabled },
      },
    }).settings.notification;

    this.broadcast(state);
    return state;
  }

  private broadcast(state: NotificationSettingsState) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('dv:notification:changed', state);
      }
    }
  }
}
