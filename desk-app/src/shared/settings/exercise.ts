import { clamp } from '#tools/number-utils';

export type ExerciseSettingsState = {
  breakEveryMin: number;
  exercisesPerBreak: number;
};

export const EXERCISE_SETTINGS_LIMITS = {
  breakEveryMin: { min: 5, max: 120, step: 5 },
  exercisesPerBreak: { min: 1, max: 3, step: 1 },
} as const;

export const EXERCISE_SETTINGS_DEFAULT_STATE: ExerciseSettingsState = {
  breakEveryMin: 30,
  exercisesPerBreak: 2,
};

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function coerceBreakEveryMin(value: unknown) {
  if (!isNumber(value)) return EXERCISE_SETTINGS_DEFAULT_STATE.breakEveryMin;

  const stepped = normalizeStep(value, EXERCISE_SETTINGS_LIMITS.breakEveryMin.step);
  return clamp(
    EXERCISE_SETTINGS_LIMITS.breakEveryMin.min,
    stepped,
    EXERCISE_SETTINGS_LIMITS.breakEveryMin.max,
  );
}

export function coerceExercisesPerBreak(value: unknown) {
  if (!isNumber(value)) return EXERCISE_SETTINGS_DEFAULT_STATE.exercisesPerBreak;

  const stepped = normalizeStep(value, EXERCISE_SETTINGS_LIMITS.exercisesPerBreak.step);
  return clamp(
    EXERCISE_SETTINGS_LIMITS.exercisesPerBreak.min,
    stepped,
    EXERCISE_SETTINGS_LIMITS.exercisesPerBreak.max,
  );
}

export function coerceExerciseSettingsState(value: unknown): ExerciseSettingsState {
  const raw = (value ?? {}) as Partial<ExerciseSettingsState>;

  return {
    breakEveryMin: coerceBreakEveryMin(raw.breakEveryMin),
    exercisesPerBreak: coerceExercisesPerBreak(raw.exercisesPerBreak),
  };
}
