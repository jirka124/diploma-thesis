import { ref } from 'vue';
import {
  EXERCISE_SETTINGS_DEFAULT_STATE,
  coerceBreakEveryMin,
  coerceExercisesPerBreak,
  type ExerciseSettingsState,
} from 'src/shared/settings/exercise';

export type { ExerciseSettingsState } from 'src/shared/settings/exercise';

const breakEveryMin = ref<number>(EXERCISE_SETTINGS_DEFAULT_STATE.breakEveryMin);
const exercisesPerBreak = ref<number>(EXERCISE_SETTINGS_DEFAULT_STATE.exercisesPerBreak);

let committedState: ExerciseSettingsState = { ...EXERCISE_SETTINGS_DEFAULT_STATE };
let inited = false;
let removeListener: (() => void) | null = null;

function syncState(state: ExerciseSettingsState) {
  committedState = { ...state };
  breakEveryMin.value = state.breakEveryMin;
  exercisesPerBreak.value = state.exercisesPerBreak;
}

function handleStateUpdate(promise: Promise<ExerciseSettingsState>) {
  void promise
    .then((state) => {
      syncState(state);
    })
    .catch((err) => console.error('Exercise settings update failed:', err));
}

export function useExerciseSettings() {
  async function initExerciseSettings() {
    if (inited) return;
    inited = true;

    if (window.electronDeskVitalsAPI?.getExerciseSettingsState) {
      const state = await window.electronDeskVitalsAPI.getExerciseSettingsState();
      syncState(state);

      removeListener = window.electronDeskVitalsAPI.onExerciseSettingsChanged((next) => {
        syncState(next);
      });

      return;
    }

    syncState(EXERCISE_SETTINGS_DEFAULT_STATE);
  }

  function setBreakEveryMin(next: number) {
    const normalized = coerceBreakEveryMin(next);
    breakEveryMin.value = normalized;

    if (window.electronDeskVitalsAPI?.setBreakEveryMin) {
      handleStateUpdate(window.electronDeskVitalsAPI.setBreakEveryMin(normalized));
      return;
    }

    syncState({
      ...committedState,
      breakEveryMin: normalized,
    });
  }

  function setExercisesPerBreak(next: number) {
    const normalized = coerceExercisesPerBreak(next);
    exercisesPerBreak.value = normalized;

    if (window.electronDeskVitalsAPI?.setExercisesPerBreak) {
      handleStateUpdate(window.electronDeskVitalsAPI.setExercisesPerBreak(normalized));
      return;
    }

    syncState({
      ...committedState,
      exercisesPerBreak: normalized,
    });
  }

  return {
    breakEveryMin,
    exercisesPerBreak,
    initExerciseSettings,
    setBreakEveryMin,
    setExercisesPerBreak,
    destroyExerciseSettingsSync() {
      if (removeListener !== null) {
        removeListener();
        removeListener = null;
      }
    },
  };
}
