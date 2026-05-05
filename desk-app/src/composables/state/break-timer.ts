import { ref } from 'vue';

import {
  BREAK_TIMER_DEFAULT_STATE,
  type BreakTimerRuntimeState,
} from 'src/shared/state/break-timer';

export type { BreakTimerRuntimeState } from 'src/shared/state/break-timer';

const intervalMs = ref<number>(BREAK_TIMER_DEFAULT_STATE.intervalMs);
const cycleStartAtIso = ref<string | null>(BREAK_TIMER_DEFAULT_STATE.cycleStartAtIso);
const nextBreakAtIso = ref<string | null>(BREAK_TIMER_DEFAULT_STATE.nextBreakAtIso);
const postponeCount = ref<number>(BREAK_TIMER_DEFAULT_STATE.postponeCount);
const canPostponeBreak = ref<boolean>(true);

let inited = false;
let removeChangedListener: (() => void) | null = null;

function syncState(state: BreakTimerRuntimeState) {
  intervalMs.value = state.intervalMs;
  cycleStartAtIso.value = state.cycleStartAtIso;
  nextBreakAtIso.value = state.nextBreakAtIso;
  postponeCount.value = state.postponeCount;
}

export function useBreakTimerRuntime() {
  async function refreshCanPostponeBreak() {
    if (!window.electronDeskVitalsAPI?.canPostponeBreak) {
      canPostponeBreak.value = true;
      return;
    }
    canPostponeBreak.value = await window.electronDeskVitalsAPI.canPostponeBreak();
  }

  async function initBreakTimerRuntime() {
    if (inited) return;
    inited = true;

    if (!window.electronDeskVitalsAPI?.getBreakTimerState) {
      syncState(BREAK_TIMER_DEFAULT_STATE);
      return;
    }

    const state = await window.electronDeskVitalsAPI.getBreakTimerState();
    syncState(state);
    await refreshCanPostponeBreak();

    removeChangedListener = window.electronDeskVitalsAPI.onBreakTimerChanged((nextState) => {
      syncState(nextState);
      void refreshCanPostponeBreak();
    });
  }

  async function takeBreak() {
    if (!window.electronDeskVitalsAPI?.takeBreak) return;
    const state = await window.electronDeskVitalsAPI.takeBreak();
    syncState(state);
    await refreshCanPostponeBreak();
  }

  async function postponeBreak(minutes: number) {
    if (!window.electronDeskVitalsAPI?.postponeBreak) return;
    await refreshCanPostponeBreak();
    if (!canPostponeBreak.value) return;
    const state = await window.electronDeskVitalsAPI.postponeBreak(minutes);
    syncState(state);
    await refreshCanPostponeBreak();
  }

  return {
    intervalMs,
    cycleStartAtIso,
    nextBreakAtIso,
    postponeCount,
    canPostponeBreak,
    initBreakTimerRuntime,
    takeBreak,
    postponeBreak,
    destroyBreakTimerRuntimeSync() {
      if (removeChangedListener !== null) {
        removeChangedListener();
        removeChangedListener = null;
      }

      inited = false;
    },
  };
}
