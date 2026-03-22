import {
  coerceExerciseSettingsState,
  type ExerciseSettingsState,
  EXERCISE_SETTINGS_DEFAULT_STATE,
} from './exercise';
import {
  coerceNotificationSettingsState,
  type NotificationSettingsState,
  NOTIFICATION_SETTINGS_DEFAULT_STATE,
} from './notification';
import {
  coerceThemeState,
  THEME_DEFAULT_STATE,
  type ThemeState,
} from './theme';

export type RuntimeSettingsConfig = {
  theme: ThemeState;
  exercise: ExerciseSettingsState;
  notification: NotificationSettingsState;
};

export type RuntimeConfig = {
  settings: RuntimeSettingsConfig;
};

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  settings: {
    theme: THEME_DEFAULT_STATE,
    exercise: EXERCISE_SETTINGS_DEFAULT_STATE,
    notification: NOTIFICATION_SETTINGS_DEFAULT_STATE,
  },
};

export function coerceRuntimeConfig(value: unknown): RuntimeConfig {
  const raw = (value ?? {}) as Partial<RuntimeConfig>;
  const rawSettings = (raw.settings ?? {}) as Partial<RuntimeSettingsConfig>;

  return {
    settings: {
      theme: coerceThemeState(rawSettings.theme),
      exercise: coerceExerciseSettingsState(rawSettings.exercise),
      notification: coerceNotificationSettingsState(rawSettings.notification),
    },
  };
}
