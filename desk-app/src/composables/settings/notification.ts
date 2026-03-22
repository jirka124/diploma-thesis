import { ref } from 'vue';
import {
  NOTIFICATION_SETTINGS_DEFAULT_STATE,
  coerceNotificationsEnabled,
  type NotificationSettingsState,
} from 'src/shared/settings/notification';

export type { NotificationSettingsState } from 'src/shared/settings/notification';

const notificationsEnabled = ref<boolean>(NOTIFICATION_SETTINGS_DEFAULT_STATE.notificationsEnabled);

let committedState: NotificationSettingsState = { ...NOTIFICATION_SETTINGS_DEFAULT_STATE };
let inited = false;
let removeListener: (() => void) | null = null;

function syncState(state: NotificationSettingsState) {
  committedState = { ...state };
  notificationsEnabled.value = state.notificationsEnabled;
}

function handleStateUpdate(promise: Promise<NotificationSettingsState>) {
  void promise
    .then((state) => {
      syncState(state);
    })
    .catch((err) => console.error('Notification settings update failed:', err));
}

export function useNotificationSettings() {
  async function initNotificationSettings() {
    if (inited) return;
    inited = true;

    if (window.electronDeskVitalsAPI?.getNotificationSettingsState) {
      const state = await window.electronDeskVitalsAPI.getNotificationSettingsState();
      syncState(state);

      removeListener = window.electronDeskVitalsAPI.onNotificationSettingsChanged((next) => {
        syncState(next);
      });

      return;
    }

    syncState(NOTIFICATION_SETTINGS_DEFAULT_STATE);
  }

  function setNotificationsEnabled(next: boolean) {
    const normalized = coerceNotificationsEnabled(next);
    notificationsEnabled.value = normalized;

    if (window.electronDeskVitalsAPI?.setNotificationsEnabled) {
      handleStateUpdate(window.electronDeskVitalsAPI.setNotificationsEnabled(normalized));
      return;
    }

    syncState({
      ...committedState,
      notificationsEnabled: normalized,
    });
  }

  return {
    notificationsEnabled,
    initNotificationSettings,
    setNotificationsEnabled,
    destroyNotificationSettingsSync() {
      if (removeListener !== null) {
        removeListener();
        removeListener = null;
      }
    },
  };
}
