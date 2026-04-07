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
                Next break <span class="accent">in {{ exerciseSettings.breakEveryMin.value }} min</span>
              </div>
              <div class="strip-time">16:24</div>
            </div>

            <div class="strip-progress">
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
          </div>

          <div class="tiles">
            <div class="tile featured">
              <div class="tile-illu">
                <q-img
                  src="/src/assets/illustrations/exercise-groups/head.png"
                  spinner-color="#E95E78"
                  fit="contain"
                  width="512"
                  height="512"
                />
              </div>
              <div class="tile-name">Eye Relax</div>
            </div>

            <div class="tile">
              <div class="tile-illu">
                <q-img
                  src="/src/assets/illustrations/exercise-groups/hands.png"
                  spinner-color="#E95E78"
                  fit="contain"
                  width="512"
                  height="512"
                />
              </div>
              <div class="tile-name">Hand Twist</div>
            </div>

            <div class="tile">
              <div class="tile-illu">
                <q-img
                  src="/src/assets/illustrations/exercise-groups/legs.png"
                  spinner-color="#E95E78"
                  fit="contain"
                  width="512"
                  height="512"
                />
              </div>
              <div class="tile-name">Leg Shake</div>
            </div>
          </div>

          <div class="actions">
            <q-btn no-caps unelevated class="ghost" icon="notifications" label="Snooze 5 Min" />

            <q-btn no-caps unelevated class="primary" label="Start Break" @click="startExercise">
              <q-badge floating class="reward-badge"
                ><q-icon name="emoji_events" size="14px" />

                3/18</q-badge
              >
            </q-btn>
          </div>
        </div>

        <div class="bottom">
          <div class="mini">
            <div class="mini-tabs">
              <q-btn
                v-for="opt in statsOptions"
                :key="opt.value"
                dense
                unelevated
                no-caps
                class="tab-btn"
                :class="{ active: statsRange === opt.value }"
                :label="opt.label"
                @click="void setStatsRange(opt.value)"
              />
            </div>

            <div class="mini-body">
              <div class="mini-head">
                <div class="t1">Statistics</div>
                <button class="link" type="button">View All Stats</button>
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

              <div class="stats">
                <div class="stat">
                  <q-icon name="emoji_events" size="18px" />
                  <div class="stat-label">Trophies earned</div>
                  <div class="stat-val">{{ breakStatistics.trophiesEarned.value }}</div>
                </div>
                <div class="stat">
                  <q-icon name="paid" size="18px" />
                  <div class="stat-label">Coins earned</div>
                  <div class="stat-val">{{ breakStatistics.coinsEarned.value }}</div>
                </div>
                <div class="stat">
                  <q-icon name="fitness_center" size="18px" />
                  <div class="stat-label">Exercises taken</div>
                  <div class="stat-val">{{ breakStatistics.exerciseCount.value }}</div>
                </div>
                <div class="stat">
                  <q-icon name="check_circle" size="18px" />
                  <div class="stat-label">Breaks taken</div>
                  <div class="stat-val">{{ breakStatistics.breakCount.value }}</div>
                </div>
                <div class="stat">
                  <q-icon name="timer" size="18px" />
                  <div class="stat-label">Work time</div>
                  <div class="stat-val">{{ workTimeLabel }}</div>
                </div>
                <div class="stat">
                  <q-icon name="timer" size="18px" />
                  <div class="stat-label">Postpone time</div>
                  <div class="stat-val">{{ postponeTimeLabel }}</div>
                </div>
                <div class="stat">
                  <q-icon name="timer" size="18px" />
                  <div class="stat-label">Exercise time</div>
                  <div class="stat-val">{{ exerciseTimeLabel }}</div>
                </div>
              </div>
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { type StatisticsDateRange, useBreakStatistics } from 'src/composables/state/statistics';
import { useThemeSettings } from 'src/composables/settings/theme';
import { useStreakQuickStatus } from 'src/composables/state/streak';
import { useExerciseSettings } from 'src/composables/settings/exercise';
import {
  computeCurrentHealthIndex,
  getCurrentHealthLabel,
  getCurrentHealthNote,
} from 'src/shared/state/health-index';
import { DateUtils } from '#tools/date-utils';

const healthSlide = ref('ring');
const autoplay = ref(true);
const exerciseSettings = useExerciseSettings();
const streakQuickStatus = useStreakQuickStatus();
const breakStatistics = useBreakStatistics();
const theme = useThemeSettings();

const nextBreakProgress = ref(0.34);

type StatsRange = 'day' | 'week' | 'month' | 'year' | 'custom';
const statsRange = ref<StatsRange>('day');
const customRangeDialog = ref(false);
const customStartDate = ref('');
const customStartTime = ref('00:00');
const customStartUseTime = ref(false);
const customEndDate = ref('');
const customEndTime = ref('23:59');
const customEndUseTime = ref(false);
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
const customRangeSummary = computed(() => {
  const { startDateIso, endDateIso } = breakStatistics.dateRange.value;
  if (!startDateIso && !endDateIso) return 'All time';

  const startLabel = startDateIso ? formatDateTimeLabel(startDateIso) : '-∞';
  const endLabel = endDateIso ? formatDateTimeLabel(endDateIso) : '+∞';
  return `${startLabel} -> ${endLabel}`;
});

const healthIndex = computed(() => {
  return computeCurrentHealthIndex({
    exerciseCount: breakStatistics.exerciseCount.value,
    workTimeSec: breakStatistics.workTimeSec.value,
    postponeTimeSec: breakStatistics.postponeTimeSec.value,
  });
});
const healthStateLabel = computed(() => getCurrentHealthLabel(healthIndex.value));
const healthNote = computed(() => getCurrentHealthNote(healthIndex.value));

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return '0m';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
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

async function startExercise() {
  const exerciseCount = exerciseSettings.exercisesPerBreak.value;
  const coinsEarned = exerciseCount * 3;

  await breakStatistics.addBreakTaken({
    trophiesEarned: Math.max(1, Math.round(exerciseCount / 2)),
    coinsEarned,
    exerciseCount,
    workTimeSec: exerciseSettings.breakEveryMin.value * 60,
    postponeTimeSec: 0,
    exerciseTimeSec: exerciseCount * 45,
  });

  await window.electronDeskVitalsAPI?.openExerciseWindow({ route: '/exercise', focus: true });
}

let progressTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  void streakQuickStatus.initStreakQuickStatus();
  void breakStatistics.initBreakStatistics(buildPresetDateRange('day'));

  progressTimer = setInterval(() => {
    nextBreakProgress.value += 0.01;
    nextBreakProgress.value = Math.min(nextBreakProgress.value, 1);
  }, 1000);
});

onUnmounted(() => {
  streakQuickStatus.destroyStreakQuickStatusSync();
  breakStatistics.destroyBreakStatisticsSync();
  if (progressTimer !== null) {
    clearInterval(progressTimer);
    progressTimer = null;
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
  height: 100px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--bg-0-rgb), 0.22);
  box-shadow: inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}
.tile-illu .q-img {
  height: 100px;
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

.reward-badge {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  background: rgba(var(--bg-0-rgb), 0.35);
  border: 1px solid rgba(var(--txt-1-rgb), 0.18);
  backdrop-filter: blur(10px);
  color: rgba(var(--txt-1-rgb), 0.92);
  font-weight: 950;
  padding: 4px 8px;
  border-radius: 999px;
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

  padding: 12px;
}

.mini {
  padding: 10px;
  border-radius: 22px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
}

.mini-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.tab-btn {
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  color: rgba(var(--txt-1-rgb), 0.62);
  font-weight: 900;
  padding: 0;
}

.tab-btn:hover {
  background: rgba(var(--txt-1-rgb), 0.05);
}

.tab-btn.active {
  background: rgba(var(--txt-1-rgb), 0.06);
  color: rgba(var(--txt-1-rgb), 0.85);
  border-color: rgba(var(--txt-1-rgb), 0.14);
}

.tab-btn:focus-visible {
  outline: 2px solid rgba(var(--accent-1-rgb), 0.45);
  outline-offset: 2px;
}

.mini-body {
  border-radius: 18px;
  background: rgba(var(--bg-0-rgb), 0.22);
  border: 1px solid rgba(var(--txt-1-rgb), 0.07);
  padding: 10px;
}

.mini-title {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 10px;
  align-items: center;
}
.mini-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--accent-1-rgb), 0.08);
  display: grid;
  place-items: center;
  color: rgba(var(--accent-1-rgb), 0.95);
}
.t1 {
  font-weight: 950;
  font-size: 16px;
}
.t2 {
  margin-top: 4px;
  color: rgba(var(--txt-1-rgb), 0.62);
  font-size: 12px;
}
.muted {
  color: rgba(var(--txt-1-rgb), 0.52);
}

.mini-row {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  color: rgba(var(--txt-1-rgb), 0.62);
}
.strong {
  margin-left: auto;
  color: rgba(var(--txt-1-rgb), 0.86);
  font-weight: 950;
}

.mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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

.stats {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 520px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .custom-grid {
    grid-template-columns: 1fr;
  }
}
.stat {
  border-radius: 16px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: rgba(var(--txt-1-rgb), 0.03);
  padding: 10px;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 8px;
  align-items: center;
  color: rgba(var(--txt-1-rgb), 0.7);
}
.stat-label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.62);
}
.stat-val {
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.85);
}
</style>


