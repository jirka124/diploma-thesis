export {};

import type { ExerciseSettingsState } from 'src/shared/settings/exercise';
import type { ExerciseRuntimeState } from 'src/shared/state/exercise-runtime';
import type { NotificationSettingsState } from 'src/shared/settings/notification';
import type {
  BreakStatisticsState,
  BreakTakenInput,
  StatisticsDateRange,
} from 'src/shared/state/statistics';
import type { StreakQuickStatusState } from 'src/shared/state/streak';
import type { BreakRuntimeState } from 'src/shared/state/break-runtime';
import type { BreakSessionState } from 'src/shared/state/break-session';
import type { Accent, ThemeMode, ThemeState } from 'src/shared/settings/theme';

declare global {
  interface Window {
    electronDeskVitalsAPI?: {
      minimize: () => void;
      minimizeFor: (seconds: number) => Promise<boolean>;
      close: () => void;
      toggleMaximize: () => Promise<boolean>;
      isMaximized: () => Promise<boolean>;
      openExerciseWindow: (payload?: { route?: string; focus?: boolean }) => Promise<boolean>;
      getThemeState: () => Promise<ThemeState>;
      setThemeMode: (mode: ThemeMode) => Promise<ThemeState>;
      setThemeAccent: (accent: Accent) => Promise<ThemeState>;
      onThemeChanged: (listener: (state: ThemeState) => void) => () => void;
      getExerciseSettingsState: () => Promise<ExerciseSettingsState>;
      setBreakEveryMin: (value: number) => Promise<ExerciseSettingsState>;
      setExercisesPerBreak: (value: number) => Promise<ExerciseSettingsState>;
      onExerciseSettingsChanged: (listener: (state: ExerciseSettingsState) => void) => () => void;
      getExerciseRuntimeState: () => Promise<ExerciseRuntimeState>;
      onExerciseRuntimeChanged: (listener: (state: ExerciseRuntimeState) => void) => () => void;
      getNotificationSettingsState: () => Promise<NotificationSettingsState>;
      setNotificationsEnabled: (value: boolean) => Promise<NotificationSettingsState>;
      onNotificationSettingsChanged: (
        listener: (state: NotificationSettingsState) => void,
      ) => () => void;
      getStreakState: () => Promise<StreakQuickStatusState>;
      onStreakChanged: (listener: (state: StreakQuickStatusState) => void) => () => void;
      getStatisticsState: (range?: StatisticsDateRange) => Promise<BreakStatisticsState>;
      addBreakTaken: (payload: BreakTakenInput) => Promise<BreakStatisticsState>;
      onStatisticsChanged: (listener: (state: BreakStatisticsState) => void) => () => void;
      getBreakState: () => Promise<BreakRuntimeState>;
      canPostponeBreak: () => Promise<boolean>;
      postponeBreak: (minutes: number) => Promise<BreakRuntimeState>;
      onBreakChanged: (listener: (state: BreakRuntimeState) => void) => () => void;
      getBreakSessionState: () => Promise<BreakSessionState>;
      startBreakSession: () => Promise<BreakSessionState>;
      pauseBreakSession: () => Promise<BreakSessionState>;
      resumeBreakSession: () => Promise<BreakSessionState>;
      skipBreakSessionExercise: () => Promise<BreakSessionState>;
      cancelBreakSession: () => Promise<BreakSessionState>;
      onBreakSessionChanged: (listener: (state: BreakSessionState) => void) => () => void;
    };
  }
}
