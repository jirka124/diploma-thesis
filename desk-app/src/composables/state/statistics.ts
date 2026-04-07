import { ref } from 'vue';

import {
  BREAK_STATISTICS_DEFAULT_STATE,
  type BreakStatisticsState,
  type BreakTakenInput,
  type StatisticsDateRange,
} from 'src/shared/state/statistics';

export type { BreakStatisticsState, BreakTakenInput, StatisticsDateRange } from 'src/shared/state/statistics';

const dateRange = ref<StatisticsDateRange>({});
const breakCount = ref<number>(BREAK_STATISTICS_DEFAULT_STATE.breakCount);
const trophiesEarned = ref<number>(BREAK_STATISTICS_DEFAULT_STATE.trophiesEarned);
const coinsEarned = ref<number>(BREAK_STATISTICS_DEFAULT_STATE.coinsEarned);
const exerciseCount = ref<number>(BREAK_STATISTICS_DEFAULT_STATE.exerciseCount);
const workTimeSec = ref<number>(BREAK_STATISTICS_DEFAULT_STATE.workTimeSec);
const postponeTimeSec = ref<number>(BREAK_STATISTICS_DEFAULT_STATE.postponeTimeSec);
const exerciseTimeSec = ref<number>(BREAK_STATISTICS_DEFAULT_STATE.exerciseTimeSec);

let inited = false;
let removeListener: (() => void) | null = null;

function syncState(state: BreakStatisticsState) {
  const nextRange: StatisticsDateRange = {};
  if (state.dateRange.startDateIso) nextRange.startDateIso = state.dateRange.startDateIso;
  if (state.dateRange.endDateIso) nextRange.endDateIso = state.dateRange.endDateIso;
  dateRange.value = nextRange;
  breakCount.value = state.breakCount;
  trophiesEarned.value = state.trophiesEarned;
  coinsEarned.value = state.coinsEarned;
  exerciseCount.value = state.exerciseCount;
  workTimeSec.value = state.workTimeSec;
  postponeTimeSec.value = state.postponeTimeSec;
  exerciseTimeSec.value = state.exerciseTimeSec;
}

function syncDefault() {
  syncState(BREAK_STATISTICS_DEFAULT_STATE);
}

function toSerializableDateRange() {
  const range = dateRange.value;
  return {
    ...(range.startDateIso ? { startDateIso: range.startDateIso } : {}),
    ...(range.endDateIso ? { endDateIso: range.endDateIso } : {}),
  };
}

export function useBreakStatistics() {
  async function refreshCurrentDateRange() {
    if (!window.electronDeskVitalsAPI?.getStatisticsState) return;
    const state = await window.electronDeskVitalsAPI.getStatisticsState(toSerializableDateRange());
    syncState(state);
  }

  async function initBreakStatistics(initialDateRange?: StatisticsDateRange) {
    if (inited) return;
    inited = true;
    dateRange.value = initialDateRange ?? {};

    if (!window.electronDeskVitalsAPI?.getStatisticsState) {
      syncDefault();
      return;
    }

    await refreshCurrentDateRange();

    removeListener = window.electronDeskVitalsAPI.onStatisticsChanged(() => {
      void window.electronDeskVitalsAPI
        ?.getStatisticsState(toSerializableDateRange())
        .then((currentRangeState) => {
          syncState(currentRangeState);
        })
        .catch((error) => {
          console.error('Statistics refresh after broadcast failed:', error);
        });
    });
  }

  async function setDateRange(nextRange: StatisticsDateRange) {
    dateRange.value = { ...nextRange };

    if (!window.electronDeskVitalsAPI?.getStatisticsState) {
      syncDefault();
      return;
    }

    await refreshCurrentDateRange();
  }

  async function addBreakTaken(payload: BreakTakenInput) {
    if (!window.electronDeskVitalsAPI?.addBreakTaken) return;
    await window.electronDeskVitalsAPI.addBreakTaken(payload);
    await refreshCurrentDateRange();
  }

  return {
    dateRange,
    breakCount,
    trophiesEarned,
    coinsEarned,
    exerciseCount,
    workTimeSec,
    postponeTimeSec,
    exerciseTimeSec,
    initBreakStatistics,
    setDateRange,
    refreshCurrentDateRange,
    addBreakTaken,
    destroyBreakStatisticsSync() {
      if (removeListener !== null) {
        removeListener();
        removeListener = null;
      }
      inited = false;
    },
  };
}
