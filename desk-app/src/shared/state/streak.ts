export type StreakQuickStatusState = {
  currentStreakDays: number;
  lastTrackedDate: string | null;
};

export const STREAK_QUICK_STATUS_DEFAULT_STATE: StreakQuickStatusState = {
  currentStreakDays: 0,
  lastTrackedDate: null,
};
