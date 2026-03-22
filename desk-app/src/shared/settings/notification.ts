export type NotificationSettingsState = {
  notificationsEnabled: boolean;
};

export const NOTIFICATION_SETTINGS_DEFAULT_STATE: NotificationSettingsState = {
  notificationsEnabled: true,
};

export function coerceNotificationsEnabled(value: unknown) {
  if (typeof value !== 'boolean') return NOTIFICATION_SETTINGS_DEFAULT_STATE.notificationsEnabled;
  return value;
}

export function coerceNotificationSettingsState(value: unknown): NotificationSettingsState {
  const raw = (value ?? {}) as Partial<NotificationSettingsState>;

  return {
    notificationsEnabled: coerceNotificationsEnabled(raw.notificationsEnabled),
  };
}
