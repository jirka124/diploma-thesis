import { ref } from 'vue';

import {
  STREAK_QUICK_STATUS_DEFAULT_STATE,
  type StreakQuickStatusState,
} from 'src/shared/state/streak';

export type { StreakQuickStatusState } from 'src/shared/state/streak';

const currentStreakDays = ref<number>(STREAK_QUICK_STATUS_DEFAULT_STATE.currentStreakDays);
const lastTrackedDate = ref<string | null>(STREAK_QUICK_STATUS_DEFAULT_STATE.lastTrackedDate);

let inited = false;
let removeListener: (() => void) | null = null;

function syncState(state: StreakQuickStatusState) {
  currentStreakDays.value = state.currentStreakDays;
  lastTrackedDate.value = state.lastTrackedDate;
}

export function useStreakQuickStatus() {
  async function initStreakQuickStatus() {
    if (inited) return;
    inited = true;

    if (window.electronDeskVitalsAPI?.getStreakState) {
      const state = await window.electronDeskVitalsAPI.getStreakState();
      syncState(state);

      removeListener = window.electronDeskVitalsAPI.onStreakChanged((next) => {
        syncState(next);
      });

      return;
    }

    syncState(STREAK_QUICK_STATUS_DEFAULT_STATE);
  }

  return {
    currentStreakDays,
    lastTrackedDate,
    initStreakQuickStatus,
    destroyStreakQuickStatusSync() {
      if (removeListener !== null) {
        removeListener();
        removeListener = null;
      }
      inited = false;
    },
  };
}
