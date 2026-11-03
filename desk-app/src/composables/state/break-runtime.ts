import { ref } from 'vue';

import {
  BREAK_RUNTIME_DEFAULT_STATE,
  type BreakRuntimeState,
} from 'src/shared/state/break-runtime';

export type { BreakRuntimeState } from 'src/shared/state/break-runtime';

const lifecycle = ref(BREAK_RUNTIME_DEFAULT_STATE.lifecycle);
const intervalMs = ref<number>(BREAK_RUNTIME_DEFAULT_STATE.intervalMs);
const cycleStartAtIso = ref<string | null>(BREAK_RUNTIME_DEFAULT_STATE.cycleStartAtIso);
const nextBreakAtIso = ref<string | null>(BREAK_RUNTIME_DEFAULT_STATE.nextBreakAtIso);
const postponeCount = ref<number>(BREAK_RUNTIME_DEFAULT_STATE.postponeCount);
const canPostponeBreak = ref<boolean>(true);

let inited = false;
let removeChangedListener: (() => void) | null = null;

function syncState(state: BreakRuntimeState) {
  lifecycle.value = state.lifecycle;
  intervalMs.value = state.intervalMs;
  cycleStartAtIso.value = state.cycleStartAtIso;
  nextBreakAtIso.value = state.nextBreakAtIso;
  postponeCount.value = state.postponeCount;
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
      syncState(BREAK_RUNTIME_DEFAULT_STATE);
      return;
    }

    syncState(await window.electronDeskVitalsAPI.getBreakState());
    await refreshCanPostponeBreak();
    removeChangedListener = window.electronDeskVitalsAPI.onBreakChanged((nextState) => {
      syncState(nextState);
      void refreshCanPostponeBreak();
    });
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
