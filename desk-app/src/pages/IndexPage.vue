<template>
  <div class="index">
    <section class="hero-card">
      <div class="hero-inner">
        <div class="health">
          <q-carousel
            v-model="healthSlide"
            animated
            swipeable
            infinite
            :autoplay="autoplay"
            transition-prev="slide-right"
            transition-next="slide-left"
            @mouseenter="autoplay = false"
            @mouseleave="autoplay = true"
            height="100%"
            class="health-carousel"
          >
            <q-carousel-slide name="ring" class="health-slide">
              <div class="ring-wrap">
                <q-circular-progress
                  rounded
                  :value="healthIndex"
                  size="190px"
                  :thickness="0.14"
                  track-color="white"
                  class="ring-q ring-accent"
                  show-value
                >
                  <div class="ring-inner">
                    <div class="ring-value">{{ healthIndex }}</div>
                    <div class="ring-label">HEALTH INDEX</div>
                    <div class="ring-state">{{ healthStateLabel }}</div>
                  </div>
                </q-circular-progress>
              </div>

              <div class="health-note">{{ healthNote }}</div>
            </q-carousel-slide>

            <q-carousel-slide name="extra" class="health-slide">
              <div class="health-extra">
                <div class="hx-title">Quick Status</div>

                <div class="hx-row">
                  <q-icon name="local_fire_department" size="18px" class="hx-ico" />
                  <div class="hx-label">Streak</div>
                  <div class="hx-val">{{ streakLabel }}</div>
                </div>

                <div class="hx-row">
                  <q-icon name="schedule" size="18px" class="hx-ico" />
                  <div class="hx-label">Work time</div>
                  <div class="hx-val">{{ workTimeLabel }}</div>
                </div>

                <div class="hx-tip">
                  <q-icon name="info" size="16px" class="hx-ico" />
                  <span>Small breaks beat long ones.</span>
                </div>
              </div>
            </q-carousel-slide>
          </q-carousel>

          <div class="health-dots">
            <button
              class="dot"
              :class="{ active: healthSlide === 'ring' }"
              type="button"
              @click="healthSlide = 'ring'"
              aria-label="Health ring"
            />
            <button
              class="dot"
              :class="{ active: healthSlide === 'extra' }"
              type="button"
              @click="healthSlide = 'extra'"
              aria-label="Extra panel"
            />
          </div>
        </div>

        <div class="main">
            <div class="main-strip compact">
              <div class="strip-top">
                <div class="strip-title">
                  Next break <span class="accent">in {{ nextBreakCountdownLabel }}</span>
                </div>
                <div class="strip-time">{{ nextBreakClockLabel }}</div>
              </div>

              <div class="strip-rewards" aria-label="Potential rewards for the next break">
                <span class="strip-reward trophy-strip-reward">
                  <q-icon name="emoji_events" size="15px" />
                  Up to {{ breakRuntime.rewardPreview.value.currentTrophies }}
                  <q-tooltip :delay="250">
                    Up to {{ breakRuntime.rewardPreview.value.currentTrophies }} trophies if you start now. Up to {{ breakRuntime.rewardPreview.value.maxTrophies }} at the configured break interval, when all planned exercises are completed.
                  </q-tooltip>
                </span>
                <span class="strip-rewards-divider">·</span>
                <span class="strip-reward coin-strip-reward">
                  <q-icon name="paid" size="15px" />
                  Up to {{ breakRuntime.coinRewardPreview.value.maxCoins }}
                  <q-tooltip :delay="250">
                    Up to {{ breakRuntime.coinRewardPreview.value.maxCoins }} coins for completing all planned exercises.
                  </q-tooltip>
                </span>
              </div>

            <div class="strip-progress">
              <div class="lp-wrap">
                <q-linear-progress
                  :value="nextBreakProgress"
                  rounded
                  class="lp"
                  track-color="rgba(255,255,255,0.05)"
                  color="transparent"
                />
                <div class="lp-gradient" :style="{ width: `${nextBreakProgress * 100}%` }"></div>
              </div>
            </div>
          </div>

          <div class="tiles">
            <div
              v-for="(exercise, index) in upcomingExercises"
              :key="exercise.id"
              class="tile"
              :class="{ featured: index === 0 }"
            >
              <div class="tile-illu">
                <DeskVitalsAvatar trigger="hover" preview portrait :interactive="false"
                  :animation="animationForExercise(exercise.id)"
                  :camera-preset="cameraPresetForExercise(exercise.id, animationForExercise(exercise.id))" />
              </div>
              <div class="tile-name">{{ exercise.title }}</div>
            </div>
          </div>

          <div class="actions">
            <q-btn
              no-caps
              unelevated
              class="ghost"
              icon="notifications"
              label="Postpone 5 Min"
              :disable="!canPostponeBreak"
              @click="void postponeBreakByFiveMin()"
            />

            <q-btn
              no-caps
              unelevated
              class="primary"
              label="Start Break"
              :disable="isBreakSessionActive"
              @click="void startBreak()"
            />
          </div>

        </div>

        <div class="bottom">
          <div class="stats-head">
            <div class="stats-title">Statistics</div>
            <div class="range-switch" role="group" aria-label="Statistics range">
              <button
                v-for="opt in statsOptions"
                :key="opt.value"
                type="button"
                class="range-btn"
                :class="{ active: statsRange === opt.value }"
                :aria-pressed="statsRange === opt.value"
                @click="void setStatsRange(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
            <button class="link stats-link" type="button">View All Stats</button>
          </div>

          <div v-if="statsRange === 'custom'" class="custom-range-inline">
            <q-icon name="event" size="16px" />
            <span>{{ customRangeSummary }}</span>
            <q-btn
              dense
              flat
              no-caps
              class="custom-range-btn"
              label="Edit Range"
              @click="customRangeDialog = true"
            />
          </div>

          <div class="kpis">
            <div v-for="kpi in statKpis" :key="kpi.label" class="kpi">
              <span class="kpi-ico" :class="kpi.tone">
                <q-icon :name="kpi.icon" size="20px" />
              </span>
              <div class="kpi-text">
                <div class="kpi-val">{{ kpi.value }}</div>
                <div class="kpi-label">{{ kpi.label }}</div>
              </div>
            </div>
          </div>

          <div class="time-split">
            <div class="ts-head">
              <div class="ts-title">Time split</div>
              <div class="ts-total">{{ trackedTimeLabel }} tracked</div>
            </div>

            <div class="ts-bar" aria-hidden="true">
              <template v-for="seg in timeSegments" :key="seg.key">
                <div
                  v-if="seg.seconds > 0"
                  class="ts-seg"
                  :class="seg.key"
                  :style="{ flexGrow: seg.seconds }"
                />
              </template>
            </div>

            <div class="ts-legend">
              <span v-for="seg in timeSegments" :key="seg.key" class="ts-item">
                <span class="ts-dot" :class="seg.key" />
                {{ seg.label }} <b>{{ seg.valueLabel }}</b>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <q-dialog v-model="customRangeDialog">
      <q-card class="custom-range-card">
        <div class="custom-range-title">Custom Statistics Range</div>

        <div class="custom-grid">
          <div class="custom-col">
            <div class="custom-label">Start (optional)</div>
            <q-input
              :model-value="customStartDate || 'Not set'"
              readonly
              dense
              outlined
              class="custom-picker-input"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="customStartDate" mask="YYYY/MM/DD" :dark="isDarkMode" color="primary" />
                  </q-popup-proxy>
                </q-icon>
                <q-icon
                  v-if="customStartDate"
                  name="close"
                  class="cursor-pointer"
                  @click.stop="clearStartDateOnly()"
                />
              </template>
            </q-input>
            <q-toggle
              v-model="customStartUseTime"
              dense
              class="custom-time-toggle"
              label="Choose start time"
              :disable="!customStartDate"
            />
            <q-input
              v-if="customStartUseTime && customStartDate"
              :model-value="customStartTime"
              readonly
              dense
              outlined
              class="custom-picker-input"
            >
              <template #append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time
                      v-model="customStartTime"
                      format24h
                      mask="HH:mm"
                      :dark="isDarkMode"
                      color="primary"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="custom-col">
            <div class="custom-label">End (optional)</div>
            <q-input
              :model-value="customEndDate || 'Not set'"
              readonly
              dense
              outlined
              class="custom-picker-input"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="customEndDate" mask="YYYY/MM/DD" :dark="isDarkMode" color="primary" />
                  </q-popup-proxy>
                </q-icon>
                <q-icon
                  v-if="customEndDate"
                  name="close"
                  class="cursor-pointer"
                  @click.stop="clearEndDateOnly()"
                />
              </template>
            </q-input>
            <q-toggle
              v-model="customEndUseTime"
              dense
              class="custom-time-toggle"
              label="Choose end time"
              :disable="!customEndDate"
            />
            <q-input
              v-if="customEndUseTime && customEndDate"
              :model-value="customEndTime"
              readonly
              dense
              outlined
              class="custom-picker-input"
            >
              <template #append>
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time
                      v-model="customEndTime"
                      format24h
                      mask="HH:mm"
                      :dark="isDarkMode"
                      color="primary"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>

        <div class="custom-actions">
          <q-btn flat no-caps label="Cancel" @click="customRangeDialog = false" />
          <q-btn flat no-caps label="Clear (All Time)" @click="void clearCustomRange()" />
          <q-btn unelevated no-caps class="custom-apply" label="Apply" @click="void applyCustomRange()" />
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import DeskVitalsAvatar from 'src/components/avatar/DeskVitalsAvatar.vue';
import { animationForExercise } from 'src/shared/exercise-animation';
import { cameraPresetForExercise } from 'src/shared/exercise-camera';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { type StatisticsDateRange, useBreakStatistics } from 'src/composables/state/statistics';
import { useThemeSettings } from 'src/composables/settings/theme';
import { useStreakQuickStatus } from 'src/composables/state/streak';
import { useBreakRuntime } from 'src/composables/state/break-runtime';
import { useBreakSessionRuntime } from 'src/composables/state/break-session';
import { useExerciseRuntime } from 'src/composables/state/exercise-runtime';
import {
  getCurrentHealthLabel,
  getCurrentHealthNote,
} from 'src/shared/state/health-index';
import { DateUtils } from '#tools/date-utils';
import { clamp01 } from '#tools/number-utils';

const healthSlide = ref('ring');
const autoplay = ref(true);
const streakQuickStatus = useStreakQuickStatus();
const breakStatistics = useBreakStatistics();
const breakRuntime = useBreakRuntime();
const breakSessionRuntime = useBreakSessionRuntime();
const exerciseRuntime = useExerciseRuntime();
const theme = useThemeSettings();

type StatsRange = 'day' | 'week' | 'month' | 'year' | 'custom';
const statsRange = ref<StatsRange>('day');
const customRangeDialog = ref(false);
const customStartDate = ref('');
const customStartTime = ref('00:00');
const customStartUseTime = ref(false);
const customEndDate = ref('');
const customEndTime = ref('23:59');
const customEndUseTime = ref(false);
const nowEpochMs = ref(Date.now());
const isDarkMode = computed(() => theme.mode.value === 'dark');

const statsOptions: Array<{ label: string; value: StatsRange }> = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
];

const streakLabel = computed(() => {
  const days = streakQuickStatus.currentStreakDays.value;
  return days === 1 ? '1 day' : `${days} days`;
});

const workTimeLabel = computed(() => formatDuration(breakStatistics.workTimeSec.value));
const postponeTimeLabel = computed(() => formatDuration(breakStatistics.postponeTimeSec.value));
const exerciseTimeLabel = computed(() => formatDuration(breakStatistics.exerciseTimeSec.value));
const trackedTimeLabel = computed(() =>
  formatDuration(
    breakStatistics.workTimeSec.value +
      breakStatistics.exerciseTimeSec.value +
      breakStatistics.postponeTimeSec.value,
  ),
);

const statKpis = computed(() => [
  { label: 'Trophies', icon: 'emoji_events', tone: 'secondary', value: breakStatistics.trophiesEarned.value },
  { label: 'Coins', icon: 'paid', tone: 'secondary', value: breakStatistics.coinsEarned.value },
  { label: 'Breaks taken', icon: 'check_circle', tone: 'accent', value: breakStatistics.breakCount.value },
  { label: 'Exercises', icon: 'fitness_center', tone: 'accent', value: breakStatistics.exerciseCount.value },
]);

const timeSegments = computed(() => [
  { key: 'work', label: 'Work', seconds: breakStatistics.workTimeSec.value, valueLabel: workTimeLabel.value },
  { key: 'exercise', label: 'Exercise', seconds: breakStatistics.exerciseTimeSec.value, valueLabel: exerciseTimeLabel.value },
  { key: 'postpone', label: 'Postponed', seconds: breakStatistics.postponeTimeSec.value, valueLabel: postponeTimeLabel.value },
]);
const customRangeSummary = computed(() => {
  const { startDateIso, endDateIso } = breakStatistics.dateRange.value;
  if (!startDateIso && !endDateIso) return 'All time';

  const startLabel = startDateIso ? formatDateTimeLabel(startDateIso) : '-∞';
  const endLabel = endDateIso ? formatDateTimeLabel(endDateIso) : '+∞';
  return `${startLabel} -> ${endLabel}`;
});

const healthIndex = computed(() => breakStatistics.healthIndex.value);
const healthStateLabel = computed(() => getCurrentHealthLabel(healthIndex.value));
const healthNote = computed(() => getCurrentHealthNote(healthIndex.value));
const nextBreakRemainingMs = computed(() => {
  const nextBreakAtIso = breakRuntime.nextBreakAtIso.value;
  if (!nextBreakAtIso) return 0;

  const nextBreakAt = new Date(nextBreakAtIso).getTime();
  if (!Number.isFinite(nextBreakAt)) return 0;

  return Math.max(0, nextBreakAt - nowEpochMs.value);
});
const nextBreakProgress = computed(() => {
  const nextBreakAtIso = breakRuntime.nextBreakAtIso.value;
  const cycleStartAtIso = breakRuntime.cycleStartAtIso.value;
  if (!nextBreakAtIso || !cycleStartAtIso) return 0;

  const nextBreakAtMs = new Date(nextBreakAtIso).getTime();
  const cycleStartAtMs = new Date(cycleStartAtIso).getTime();
  if (!Number.isFinite(nextBreakAtMs) || !Number.isFinite(cycleStartAtMs)) return 0;

  const totalCycleMs = nextBreakAtMs - cycleStartAtMs;
  if (totalCycleMs <= 0) return 0;

  const elapsedMs = nowEpochMs.value - cycleStartAtMs;
  return clamp01(elapsedMs / totalCycleMs);
});
const nextBreakCountdownLabel = computed(() =>
  formatBreakCountdown(nextBreakRemainingMs.value),
);
const nextBreakClockLabel = computed(() => {
  const nextBreakAtIso = breakRuntime.nextBreakAtIso.value;
  if (!nextBreakAtIso) return '--:--';

  const nextBreakAt = new Date(nextBreakAtIso);
  if (Number.isNaN(nextBreakAt.getTime())) return '--:--';

  return nextBreakAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
});
const canPostponeBreak = computed(() => breakRuntime.canPostponeBreak.value);
const isBreakSessionActive = computed(() => {
  const status = breakSessionRuntime.state.value.status;
  return status === 'running' || status === 'paused';
});
const upcomingExercises = computed(() => exerciseRuntime.state.value.upcomingExercises);

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return '0m';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatBreakCountdown(totalMs: number) {
  const safeMs = Math.max(0, Math.round(totalMs));
  const totalSeconds = Math.ceil(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDateTimeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return DateUtils.formatLocalDateTime(date);
}

function buildPresetDateRange(nextRange: Exclude<StatsRange, 'custom'>): StatisticsDateRange {
  const now = new Date();

  if (nextRange === 'day') {
    return { startDateIso: DateUtils.toIsoDateTime(DateUtils.startOfLocalDay(now)) };
  }

  if (nextRange === 'week') {
    return { startDateIso: DateUtils.toIsoDateTime(DateUtils.shiftDays(now, -7)) };
  }

  if (nextRange === 'month') {
    return { startDateIso: DateUtils.toIsoDateTime(DateUtils.shiftDays(now, -30)) };
  }

  return { startDateIso: DateUtils.toIsoDateTime(DateUtils.shiftDays(now, -365)) };
}

function clearStartDateOnly() {
  customStartDate.value = '';
  customStartTime.value = '00:00';
  customStartUseTime.value = false;
}

function clearEndDateOnly() {
  customEndDate.value = '';
  customEndTime.value = '23:59';
  customEndUseTime.value = false;
}

async function setStatsRange(nextRange: StatsRange) {
  statsRange.value = nextRange;

  if (nextRange === 'custom') {
    await breakStatistics.setDateRange({});
    clearStartDateOnly();
    clearEndDateOnly();
    customRangeDialog.value = true;
    return;
  }

  await breakStatistics.setDateRange(buildPresetDateRange(nextRange));
}

async function applyCustomRange() {
  const startDateIso = DateUtils.fromDatePickerToIso(
    customStartDate.value,
    customStartUseTime.value ? customStartTime.value : '',
    false,
  );
  const endDateIso = DateUtils.fromDatePickerToIso(
    customEndDate.value,
    customEndUseTime.value ? customEndTime.value : '',
    true,
  );
  const nextRange: StatisticsDateRange = {
    ...(startDateIso ? { startDateIso } : {}),
    ...(endDateIso ? { endDateIso } : {}),
  };

  await breakStatistics.setDateRange(nextRange);
  customRangeDialog.value = false;
}

async function clearCustomRange() {
  clearStartDateOnly();
  clearEndDateOnly();

  await breakStatistics.setDateRange({});
  customRangeDialog.value = false;
}

async function startBreak() {
  if (isBreakSessionActive.value) return;
  await breakSessionRuntime.startBreakSession();
}

async function postponeBreakByFiveMin() {
  if (!canPostponeBreak.value) return;
  await breakRuntime.postponeBreak(5);
}

let uiTickTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  void streakQuickStatus.initStreakQuickStatus();
  void breakStatistics.initBreakStatistics(buildPresetDateRange('day'));
  void breakRuntime.initBreakRuntime();
  void breakSessionRuntime.initBreakSessionRuntime();
  void exerciseRuntime.initExerciseRuntime();

  uiTickTimer = setInterval(() => {
    nowEpochMs.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  streakQuickStatus.destroyStreakQuickStatusSync();
  breakStatistics.destroyBreakStatisticsSync();
  breakRuntime.destroyBreakRuntimeSync();
  breakSessionRuntime.destroyBreakSessionRuntimeSync();
  exerciseRuntime.destroyExerciseRuntimeSync();
  if (uiTickTimer !== null) {
    clearInterval(uiTickTimer);
    uiTickTimer = null;
  }
});
</script>

<style scoped>
.index {
  min-height: 100%;
}

.hero-card {
  min-height: 100%;
  border-radius: var(--dv-radius-xl);
  overflow: hidden;
}

.hero-inner {
  min-height: 100%;
  padding: 16px;
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: auto auto;
  gap: 14px;
}

.health {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 10px;
  padding: 6px 4px;
  min-height: 0;
}

.health-carousel {
  border-radius: 18px;
  min-height: 0;
  background: transparent;
}

.health-slide {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 14px;
  padding: 0;
}

.health-note {
  text-align: center;
  color: rgba(var(--txt-1-rgb), 0.7);
  font-size: 14px;
}

.health-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.2);
  background: rgba(var(--txt-1-rgb), 0.08);
  cursor: pointer;
}
.dot.active {
  background: rgba(var(--accent-1-rgb), 0.85);
  border-color: rgba(var(--accent-1-rgb), 0.6);
}

.health-extra {
  width: 100%;
  max-width: 230px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--bg-0-rgb), 0.14);
  padding: 12px;
}

.hx-title {
  font-weight: 950;
  font-size: 14px;
  color: rgba(var(--txt-1-rgb), 0.86);
  margin-bottom: 10px;
}

.hx-row {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
  margin-bottom: 8px;
}

.hx-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
}
.hx-label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.62);
}
.hx-val {
  font-size: 12px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.82);
}

.hx-tip {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
  color: rgba(var(--txt-1-rgb), 0.7);
  font-size: 12px;
}

.ring-wrap {
  display: grid;
  place-items: center;
}

.ring-q {
  filter: drop-shadow(0 14px 40px rgba(var(--accent-1-rgb), 0.15));
}
.ring-q :deep(.q-circular-progress__inner) {
  border-radius: 999px;
  background:
    radial-gradient(600px 300px at 30% 20%, rgba(var(--accent-1-rgb), 0.1), transparent 55%),
    rgba(var(--bg-15-rgb), 0.88);
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  backdrop-filter: blur(10px);
}
.ring-accent {
  color: rgba(var(--accent-1-rgb), 1);
}
.ring-q :deep(.q-circular-progress__track) {
  stroke: rgba(var(--txt-1-rgb), 0.12);
}

.ring {
  width: 190px;
  height: 190px;
  border-radius: 999px;
  background: conic-gradient(
    from 220deg,
    rgba(var(--accent-1-rgb), 0.95) 0deg,
    rgba(var(--accent-4-rgb), 0.9) 190deg,
    rgba(var(--txt-1-rgb), 0.1) 190deg,
    rgba(var(--txt-1-rgb), 0.1) 360deg
  );
  position: relative;
  filter: drop-shadow(0 14px 40px rgba(var(--accent-1-rgb), 0.15));
}
.ring::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 999px;
  background:
    radial-gradient(600px 300px at 30% 20%, rgba(var(--accent-1-rgb), 0.1), transparent 55%),
    rgba(var(--bg-15-rgb), 0.88);
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  backdrop-filter: blur(10px);
}

.ring-inner {
  position: absolute;
  inset: 12px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  text-align: center;
  z-index: 1;
}

.ring-value {
  font-size: 48px;
  font-weight: 950;
  letter-spacing: -1px;
  color: rgba(var(--accent-1-rgb), 0.95);
}
.ring-label {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.9px;
  color: rgba(var(--txt-1-rgb), 0.78);
}
.ring-state {
  margin-top: 10px;
  font-size: 13px;
  color: rgba(var(--txt-1-rgb), 0.66);
}

.health-note {
  text-align: center;
  color: rgba(var(--txt-1-rgb), 0.7);
  font-size: 14px;
}

.main {
  display: grid;
  grid-template-rows: auto auto auto;
  padding: 12px;
  gap: 10px;
  border-radius: var(--dv-radius-xl);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  box-shadow:
    0 22px 70px rgba(var(--bg-0-rgb), 0.55),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
}

.accent {
  color: rgba(var(--accent-4-rgb), 0.98);
}

.main-strip.compact {
  padding: 10px 12px;
  border-radius: 18px;
}

.strip-top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
}

.strip-title {
  font-size: 16px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.86);
}

.strip-time {
  font-size: 18px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.78);
}

.strip-progress {
  margin-top: 8px;
}

.lp-wrap {
  position: relative;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.05);
}

.lp {
  height: 100%;
}

.lp-gradient {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(var(--accent-4-rgb), 0.98),
    rgba(var(--accent-1-rgb), 0.88),
    rgba(var(--accent-5-rgb), 0.55)
  );
  box-shadow: 0 0 40px rgba(var(--accent-1-rgb), 0.18);
  pointer-events: none;
}

.tiles {
  display: flex;
  gap: 10px;
  min-height: 150px;
  padding: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scroll-snap-type: x mandatory;
}

.tile {
  flex: 0 0 200px;
  scroll-snap-align: start;
  border-radius: var(--dv-radius-lg);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.04);
  padding: 10px;
  min-height: 128px;

  box-shadow:
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04),
    inset 0 -18px 30px rgba(var(--bg-0-rgb), 0.35);
}
.tile:hover {
  border-color: rgba(var(--txt-1-rgb), 0.09);
  background: linear-gradient(180deg, rgba(var(--txt-1-rgb), 0.035), rgba(var(--bg-0-rgb), 0.1));
}

.tile-illu {
  height: 140px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--bg-0-rgb), 0.22);
  box-shadow: inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}
.tile-illu .q-img {
  height: 100%;
  width: 100%;

  /* Black version for app light version */
  /*filter: invert(0%) sepia(20%) saturate(0%) hue-rotate(35deg) brightness(103%) contrast(102%);*/
}
.tile-illu .q-img img {
  height: 100%;
  width: auto;
}

.tile-name {
  font-weight: 950;
  font-size: 14px;
}

.actions {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 14px;
  align-items: center;
  margin-top: 4px;
}

.ghost {
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.04);
  color: rgba(var(--txt-1-rgb), 0.78);
}
.ghost:hover {
  background: rgba(var(--txt-1-rgb), 0.06);
}

.primary {
  height: 40px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 950;
  letter-spacing: 0.2px;
  color: rgba(var(--txt-1-rgb), 0.92);
  background: linear-gradient(
    90deg,
    rgba(var(--accent-1-rgb), 0.95),
    rgba(var(--accent-4-rgb), 0.9)
  );
  box-shadow: 0 18px 60px rgba(var(--accent-1-rgb), 0.18);
}
.primary:hover {
  filter: brightness(1.05);
}

.strip-rewards {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
  color: rgba(var(--txt-1-rgb), 0.68);
  font-size: 12px;
  font-weight: 900;
}
.strip-reward {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: rgba(var(--txt-1-rgb), 0.72);
}
.coin-strip-reward {
  cursor: help;
}
.trophy-strip-reward {
  cursor: help;
}
.strip-rewards-divider {
  color: rgba(var(--txt-1-rgb), 0.3);
}

.bottom {
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1fr;
  grid-column: 1 / -1;
  gap: 14px;
  border-radius: var(--dv-radius-xl);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  box-shadow:
    0 22px 70px rgba(var(--bg-0-rgb), 0.55),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);

  padding: 16px 18px 18px;
}

.link {
  border: none;
  background: transparent;
  color: rgba(var(--txt-1-rgb), 0.55);
  cursor: pointer;
  font-weight: 800;
}
.link:hover {
  color: rgba(var(--txt-1-rgb), 0.75);
}

.custom-range-inline {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(var(--txt-1-rgb), 0.72);
  font-size: 12px;
}

.custom-range-btn {
  margin-left: auto;
  color: rgba(var(--accent-4-rgb), 0.95);
}

.custom-range-card {
  width: min(900px, 95vw);
  max-width: 95vw;
  border-radius: 18px;
  background: rgba(var(--bg-20-rgb), 1);
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  padding: 14px;
}

.custom-range-title {
  font-size: 16px;
  font-weight: 900;
  margin-bottom: 12px;
}

.custom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.custom-col {
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  padding: 10px;
  background: rgba(var(--txt-1-rgb), 0.02);
  display: grid;
  gap: 10px;
}

.custom-label {
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.72);
  margin-bottom: 8px;
  font-weight: 800;
}

.custom-time-toggle {
  color: rgba(var(--txt-1-rgb), 0.82);
}

.custom-picker-input :deep(.q-field__control) {
  border-radius: 10px;
}

.custom-picker-input :deep(.q-field__native),
.custom-picker-input :deep(.q-field__input) {
  color: rgba(var(--txt-1-rgb), 0.9) !important;
}

.custom-picker-input :deep(.q-field__marginal),
.custom-picker-input :deep(.q-icon) {
  color: rgba(var(--txt-1-rgb), 0.75) !important;
}

.custom-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.custom-apply {
  background: rgba(var(--accent-1-rgb), 0.92);
  color: rgba(var(--txt-1-rgb), 0.95);
}


.stats-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stats-title {
  font-weight: 950;
  font-size: 16px;
}

.range-switch {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(var(--bg-0-rgb), 0.3);
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
}

.range-btn {
  height: 26px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(var(--txt-1-rgb), 0.6);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.range-btn:hover {
  color: rgba(var(--txt-1-rgb), 0.85);
}
.range-btn.active {
  background: rgba(var(--txt-1-rgb), 0.1);
  color: rgba(var(--txt-1-rgb), 0.92);
  font-weight: 950;
}
.range-btn:focus-visible {
  outline: 2px solid rgba(var(--accent-1-rgb), 0.45);
  outline-offset: 2px;
}

.stats-link {
  margin-left: auto;
}

.bottom .custom-range-inline {
  margin-top: 0;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.kpi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(var(--txt-1-rgb), 0.03);
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  min-width: 0;
}

.kpi-ico {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
}
.kpi-ico.secondary {
  background: rgba(var(--accent-5-rgb), 0.16);
  color: rgba(var(--accent-5-rgb), 1);
}
.kpi-ico.accent {
  background: rgba(var(--accent-1-rgb), 0.16);
  color: rgba(var(--accent-4-rgb), 1);
}

.kpi-text {
  min-width: 0;
}
.kpi-val {
  font-size: 22px;
  font-weight: 950;
  line-height: 1.1;
  color: rgba(var(--txt-1-rgb), 0.92);
}
.kpi-label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-split {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(var(--txt-1-rgb), 0.03);
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
}

.ts-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.ts-title {
  font-size: 13px;
  font-weight: 950;
}
.ts-total {
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.6);
}

.ts-bar {
  display: flex;
  gap: 3px;
  height: 10px;
  border-radius: 999px;
  background: rgba(var(--txt-1-rgb), 0.05);
}
.ts-seg {
  flex-basis: 0;
  min-width: 6px;
  border-radius: 999px;
}

.ts-seg.work,
.ts-dot.work {
  background: rgba(var(--accent-1-rgb), 1);
}
.ts-seg.exercise,
.ts-dot.exercise {
  background: rgba(var(--accent-5-rgb), 1);
}
.ts-seg.postpone,
.ts-dot.postpone {
  background: rgba(var(--txt-1-rgb), 0.3);
}

.ts-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.6);
}
.ts-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ts-item b {
  color: rgba(var(--txt-1-rgb), 0.9);
}
.ts-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

@media (max-width: 720px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stats-head {
    flex-wrap: wrap;
  }
}

@media (max-width: 520px) {
  .custom-grid {
    grid-template-columns: 1fr;
  }
}
</style>


