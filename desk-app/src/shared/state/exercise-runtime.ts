export type ExercisePlanExercise = {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  durationMs: number;
  instructions: string[];
  imageKey: string;
};

export type ExerciseRuntimeState = {
  upcomingExercises: ExercisePlanExercise[];
  updatedAtIso: string;
};

export const EXERCISE_RUNTIME_DEFAULT_STATE: ExerciseRuntimeState = {
  upcomingExercises: [],
  updatedAtIso: new Date(0).toISOString(),
};
