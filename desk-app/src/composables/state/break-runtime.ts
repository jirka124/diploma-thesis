import { ref } from 'vue';

import {
  BREAK_CYCLE_DEFAULT_STATE,
  type BreakRuntimeState,
} from 'src/shared/state/break-runtime';
import { computeBreakRewardPreview } from 'src/shared/state/break-reward';

export type { BreakRuntimeState } from 'src/shared/state/break-runtime';

const lifecycle = ref(BREAK_CYCLE_DEFAULT_STATE.lifecycle);
const intervalMs = ref<number>(BREAK_CYCLE_DEFAULT_STATE.intervalMs);
const cycleStartAtIso = ref<string | null>(BREAK_CYCLE_DEFAULT_STATE.cycleStartAtIso);
const nextBreakAtIso = ref<string | null>(BREAK_CYCLE_DEFAULT_STATE.nextBreakAtIso);
const postponeCount = ref<number>(BREAK_CYCLE_DEFAULT_STATE.postponeCount);
const rewardPreview = ref(
  computeBreakRewardPreview({
    ...BREAK_CYCLE_DEFAULT_STATE,
    exercisesPerBreak: 0,
    carryCredits: 0,
  }),
);
const canPostponeBreak = ref<boolean>(false);

let inited = false;
let removeChangedListener: (() => void) | null = null;

function syncState(state: BreakRuntimeState) {
  lifecycle.value = state.lifecycle;
  intervalMs.value = state.intervalMs;
  cycleStartAtIso.value = state.cycleStartAtIso;
  nextBreakAtIso.value = state.nextBreakAtIso;
  postponeCount.value = state.postponeCount;
  rewardPreview.value = state.rewardPreview;
}

export function useBreakRuntime() {
  async function refreshCanPostponeBreak() {
    if (!window.electronDeskVitalsAPI?.canPostponeBreak) {
      canPostponeBreak.value = true;
      return;
    }
    canPostponeBreak.value = await window.electronDeskVitalsAPI.canPostponeBreak();
  }

  async function initBreakRuntime() {
    if (inited) return;
    inited = true;

    if (!window.electronDeskVitalsAPI?.getBreakState) {
      syncState({
        ...BREAK_CYCLE_DEFAULT_STATE,
        rewardPreview: computeBreakRewardPreview({
          ...BREAK_CYCLE_DEFAULT_STATE,
          exercisesPerBreak: 0,
          carryCredits: 0,
        }),
      });
      canPostponeBreak.value = true;
      return;
    }

    let receivedRuntimeUpdate = false;
    removeChangedListener = window.electronDeskVitalsAPI.onBreakChanged((nextState) => {
      receivedRuntimeUpdate = true;
      syncState(nextState);
      void refreshCanPostponeBreak();
    });
    const initialState = await window.electronDeskVitalsAPI.getBreakState();
    if (!receivedRuntimeUpdate) syncState(initialState);
    await refreshCanPostponeBreak();
  }

  async function postponeBreak(minutes: number) {
    if (!window.electronDeskVitalsAPI?.postponeBreak) return;
    await refreshCanPostponeBreak();
    if (!canPostponeBreak.value) return;
    syncState(await window.electronDeskVitalsAPI.postponeBreak(minutes));
    await refreshCanPostponeBreak();
  }

  return {
    lifecycle,
    intervalMs,
    cycleStartAtIso,
    nextBreakAtIso,
    postponeCount,
    rewardPreview,
    canPostponeBreak,
    initBreakRuntime,
    postponeBreak,
    destroyBreakRuntimeSync() {
      removeChangedListener?.();
      removeChangedListener = null;
      inited = false;
    },
  };
}
