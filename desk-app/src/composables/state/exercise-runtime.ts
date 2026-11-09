import { ref } from 'vue';

import {
  EXERCISE_RUNTIME_DEFAULT_STATE,
  type ExerciseRuntimeState,
} from 'src/shared/state/exercise-runtime';

export type { ExercisePlanExercise, ExerciseRuntimeState } from 'src/shared/state/exercise-runtime';

const state = ref<ExerciseRuntimeState>({ ...EXERCISE_RUNTIME_DEFAULT_STATE, upcomingExercises: [] });
let inited = false;
let removeChangedListener: (() => void) | null = null;

function syncState(nextState: ExerciseRuntimeState) {
  state.value = {
    ...nextState,
    upcomingExercises: nextState.upcomingExercises.map((exercise) => ({
      ...exercise,
      instructions: [...exercise.instructions],
    })),
  };
}

export function useExerciseRuntime() {
  async function initExerciseRuntime() {
    if (inited) return;
    inited = true;
    if (!window.electronDeskVitalsAPI?.getExerciseRuntimeState) {
      syncState(EXERCISE_RUNTIME_DEFAULT_STATE);
      return;
    }

    let receivedUpdate = false;
    removeChangedListener = window.electronDeskVitalsAPI.onExerciseRuntimeChanged((nextState) => {
      receivedUpdate = true;
      syncState(nextState);
    });
    const initialState = await window.electronDeskVitalsAPI.getExerciseRuntimeState();
    if (!receivedUpdate) syncState(initialState);
  }

  return {
    state,
    initExerciseRuntime,
    destroyExerciseRuntimeSync() {
      removeChangedListener?.();
      removeChangedListener = null;
      inited = false;
    },
  };
}
