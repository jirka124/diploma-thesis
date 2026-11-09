import { ref } from 'vue';

import {
  BREAK_SESSION_DEFAULT_STATE,
  type BreakSessionState,
} from 'src/shared/state/break-session';

export type { BreakSessionState } from 'src/shared/state/break-session';

const state = ref<BreakSessionState>({ ...BREAK_SESSION_DEFAULT_STATE, exercises: [] });

let inited = false;
let removeChangedListener: (() => void) | null = null;

function syncState(nextState: BreakSessionState) {
  state.value = {
    ...nextState,
    exercises: nextState.exercises.map((exercise) => ({
      ...exercise,
      instructions: [...exercise.instructions],
    })),
  };
}

export function useBreakSessionRuntime() {
  async function initBreakSessionRuntime() {
    if (inited) return;
    inited = true;

    if (!window.electronDeskVitalsAPI?.getBreakSessionState) {
      syncState(BREAK_SESSION_DEFAULT_STATE);
      return;
    }

    let receivedSessionUpdate = false;
    removeChangedListener = window.electronDeskVitalsAPI.onBreakSessionChanged((nextState) => {
      receivedSessionUpdate = true;
      syncState(nextState);
    });
    const initialState = await window.electronDeskVitalsAPI.getBreakSessionState();
    if (!receivedSessionUpdate) syncState(initialState);
  }

  async function startBreakSession() {
    if (!window.electronDeskVitalsAPI?.startBreakSession) return;
    const nextState = await window.electronDeskVitalsAPI.startBreakSession();
    syncState(nextState);
  }

  async function pauseBreakSession() {
    if (!window.electronDeskVitalsAPI?.pauseBreakSession) return;
    const nextState = await window.electronDeskVitalsAPI.pauseBreakSession();
    syncState(nextState);
  }

  async function resumeBreakSession() {
    if (!window.electronDeskVitalsAPI?.resumeBreakSession) return;
    const nextState = await window.electronDeskVitalsAPI.resumeBreakSession();
    syncState(nextState);
  }

  async function skipBreakSessionExercise() {
    if (!window.electronDeskVitalsAPI?.skipBreakSessionExercise) return;
    const nextState = await window.electronDeskVitalsAPI.skipBreakSessionExercise();
    syncState(nextState);
  }

  async function cancelBreakSession() {
    if (!window.electronDeskVitalsAPI?.cancelBreakSession) return;
    const nextState = await window.electronDeskVitalsAPI.cancelBreakSession();
    syncState(nextState);
  }

  return {
    state,
    initBreakSessionRuntime,
    startBreakSession,
    pauseBreakSession,
    resumeBreakSession,
    skipBreakSessionExercise,
    cancelBreakSession,
    destroyBreakSessionRuntimeSync() {
      if (removeChangedListener !== null) {
        removeChangedListener();
        removeChangedListener = null;
      }
      inited = false;
    },
  };
}
