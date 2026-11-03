export type BreakSessionStatus = 'waiting' | 'running' | 'paused' | 'finished' | 'canceled';

export type BreakSessionExerciseStatus = 'pending' | 'running' | 'done' | 'skipped';

export type BreakSessionExercise = {
  id: string;
  title: string;
  durationMs: number;
  status: BreakSessionExerciseStatus;
};

export type BreakSessionState = {
  status: BreakSessionStatus;
  startedAtIso: string | null;
  pausedAtIso: string | null;
  endedAtIso: string | null;
  currentExerciseIndex: number;
  exerciseRunTimestamp: number;
  exercises: BreakSessionExercise[];
  updatedAtIso: string;
};

export const BREAK_SESSION_DEFAULT_STATE: BreakSessionState = {
  status: 'waiting',
  startedAtIso: null,
  pausedAtIso: null,
  endedAtIso: null,
  currentExerciseIndex: -1,
  exerciseRunTimestamp: 0,
  exercises: [],
  updatedAtIso: new Date(0).toISOString(),
};
