<template>
  <div class="exercise">
    <section class="ex-card">
      <header class="topbar q-electron-drag">
        <div class="tb-left">
          <div class="tb-title">Break</div>
          <div class="tb-sub">
            <span class="pill">
              <q-icon name="timer" size="16px" />
              Total left <b>{{ fmt(totalRemainingSec) }}</b>
            </span>
            <span class="pill muted">
              <q-icon name="fitness_center" size="16px" />
              {{ currentIndex + 1 }}/{{ exercises.length }}
            </span>
          </div>
        </div>

        <div class="tb-right">
          <q-btn no-caps unelevated class="ghost" icon="minimize" @click="minimizeFor10" />
          <q-btn
            no-caps
            unelevated
            class="ghost"
            :icon="isMax ? 'mdi-window-restore' : 'mdi-window-maximize'"
            aria-label="Maximize"
            @click="toggleMaximize"
          />
          <q-btn
            no-caps
            unelevated
            class="ghost"
            :icon="isPaused ? 'play_arrow' : 'pause'"
            :label="isPaused ? 'Resume' : 'Pause'"
            @click="togglePause"
          />
          <q-btn
            no-caps
            unelevated
            class="danger"
            icon="close"
            label="Cancel"
            @click="cancelBreak"
          />
        </div>
      </header>

      <div class="content">
        <div class="left">
          <div class="viewer">
            <div class="viewer-head">
              <div class="vh-left">
                <div class="ex-name">{{ current?.name || 'none' }}</div>
                <div class="ex-meta">
                  <span class="pill muted">
                    <q-icon name="hourglass_bottom" size="16px" />
                    Next <b>{{ nextUpCompact }}</b>
                  </span>
                </div>
              </div>

              <div class="vh-right">
                <div class="big-time">{{ fmt(currentRemainingSec) }}</div>
                <div class="small-time">total {{ fmt(totalRemainingSec) }}</div>
              </div>
            </div>

            <div class="viewer-stage">
              <q-img
                :src="current?.preview"
                fit="contain"
                class="stage-img"
                spinner-color="#E95E78"
              />

              <div class="stage-overlay">
                <div class="stage-badge" :class="{ paused: isPaused }">
                  <q-icon :name="isPaused ? 'pause_circle' : 'play_circle'" size="18px" />
                  <span>{{ isPaused ? 'Paused' : 'Playing' }}</span>
                </div>

                <div class="stage-progress">
                  <div class="lp-wrap">
                    <q-linear-progress
                      :value="currentProgress"
                      rounded
                      class="lp"
                      track-color="rgba(255,255,255,0.06)"
                      color="transparent"
                    />
                    <div class="lp-gradient" :style="{ width: `${currentProgress * 100}%` }"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="viewer-foot">
              <q-btn
                no-caps
                unelevated
                class="ghost"
                icon="skip_next"
                label="Skip"
                @click="skipExercise"
              />
              <q-btn
                no-caps
                unelevated
                class="primary"
                :icon="isPaused ? 'play_arrow' : 'pause'"
                :label="isPaused ? 'Resume' : 'Pause'"
                @click="togglePause"
              />
            </div>
          </div>
        </div>

        <aside class="right">
          <div class="side-card">
            <div class="side-tabs">
              <q-btn
                dense
                unelevated
                no-caps
                class="tab-btn"
                :class="{ active: sideTab === 'queue' }"
                label="Up next"
                @click="sideTab = 'queue'"
              />
              <q-btn
                dense
                unelevated
                no-caps
                class="tab-btn"
                :class="{ active: sideTab === 'steps' }"
                label="How to"
                @click="sideTab = 'steps'"
              />
            </div>

            <div v-if="sideTab === 'queue'" class="queue">
              <div class="queue-head">
                <div>
                  <div class="t1">Up next</div>
                  <div class="t2">
                    Total remaining <b>{{ fmt(totalRemainingSec) }}</b>
                  </div>
                </div>

                <div class="queue-chip">
                  <q-icon name="playlist_play" size="18px" />
                  <span>{{ exercises.length - (currentIndex + 1) }} more</span>
                </div>
              </div>

              <div class="queue-list dv-scroll-area">
                <div
                  v-for="(ex, idx) in upcoming"
                  :key="ex.id"
                  class="q-item"
                  :class="{ soon: idx === 0 }"
                >
                  <div class="q-thumb">
                    <q-img :src="ex.preview" fit="contain" spinner-color="#E95E78" />
                  </div>

                  <div class="q-main">
                    <div class="q-name">{{ ex.name }}</div>
                    <div class="q-sub">
                      <span class="muted">{{ ex.steps.length }} steps</span>
                      <span class="dot"></span>
                      <span class="muted">{{ fmt(ex.durationSec) }}</span>
                    </div>
                  </div>

                  <div class="q-right">
                    <div
                      class="q-eta"
                      v-if="etaForUpcoming[idx] !== undefined && etaForUpcoming[idx] >= 0"
                    >
                      in {{ fmt(etaForUpcoming[idx]) }}
                    </div>
                  </div>
                </div>

                <div v-if="upcoming.length === 0" class="queue-empty">
                  <q-icon name="check_circle" size="18px" />
                  <div>
                    <div class="qe-title">All done</div>
                    <div class="qe-sub">Nice. You can close this break.</div>
                  </div>
                </div>
              </div>

              <div class="queue-foot">
                <div class="qf-left">
                  <div class="qf-label">Earn</div>
                  <div class="qf-val">
                    <q-icon name="paid" size="18px" />
                    +3 coins
                  </div>
                </div>

                <q-btn
                  no-caps
                  unelevated
                  class="ghost"
                  icon="volume_off"
                  label="Mute"
                  @click="toggleMute"
                />
              </div>
            </div>

            <div v-else class="stepsPanel">
              <div class="steps-head">
                <div class="t1">How to do it</div>
                <div class="t2">Follow the steps slowly, no pain.</div>
              </div>

              <div class="steps-meta">
                <div class="meta-row">
                  <q-icon name="schedule" size="18px" class="meta-ico" />
                  <div class="meta-label">Current</div>
                  <div class="meta-val">{{ fmt(currentRemainingSec) }}</div>
                </div>
                <div class="meta-row">
                  <q-icon name="hourglass_bottom" size="18px" class="meta-ico" />
                  <div class="meta-label">Total left</div>
                  <div class="meta-val">{{ fmt(totalRemainingSec) }}</div>
                </div>
                <div class="meta-row" v-if="upcoming[0]">
                  <q-icon name="skip_next" size="18px" class="meta-ico" />
                  <div class="meta-label">Next up</div>
                  <div class="meta-val">{{ upcoming[0].name }}</div>
                </div>
              </div>

              <ol class="steps-list dv-scroll-area">
                <li v-for="(s, i) in current?.steps || []" :key="i" class="step">
                  <div class="step-n">{{ i + 1 }}</div>
                  <div class="step-t">{{ s }}</div>
                </li>
              </ol>

              <div class="hint">
                <q-icon name="info" size="18px" class="hx-ico" />
                <div class="hint-t">Tip: try to keep shoulders down and breathe slowly.</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useExerciseSettings } from 'src/composables/settings/exercise';

type Exercise = {
  id: string;
  name: string;
  durationSec: number;
  preview: string;
  steps: string[];
};

const allExercises: Exercise[] = [
  {
    id: 'neck-tilt',
    name: 'Neck Side Tilt',
    durationSec: 35,
    preview: '/src/assets/demo-avatar-default.png',
    steps: [
      'Sit tall, shoulders down.',
      'Gently tilt your head toward the right shoulder.',
      'Hold, breathe slowly, no pain.',
      'Switch sides near the end.',
    ],
  },
  {
    id: 'shoulder-roll',
    name: 'Shoulder Rolls',
    durationSec: 30,
    preview: '/src/assets/demo-avatar-default.png',
    steps: [
      'Relax your arms along the body.',
      'Roll shoulders up → back → down.',
      'Move slowly and keep breathing.',
    ],
  },
  {
    id: 'wrist-stretch',
    name: 'Wrist Stretch',
    durationSec: 40,
    preview: '/src/assets/demo-avatar-default.png',
    steps: [
      'Extend one arm forward, palm up.',
      'Gently pull fingers down with the other hand.',
      'Hold, then switch sides.',
    ],
  },
  {
    id: 'eye-break',
    name: 'Eye Focus (20–20)',
    durationSec: 25,
    preview: '/src/assets/demo-avatar-default.png',
    steps: ['Look at something far away.', 'Blink slowly a few times.', 'Relax your face and jaw.'],
  },
];

const $q = useQuasar();
const exerciseSettings = useExerciseSettings();
const exercises = computed<Exercise[]>(() =>
  allExercises.slice(0, exerciseSettings.exercisesPerBreak.value),
);
const currentIndex = ref(0);
const isPaused = ref(false);
const isPausedByMinimize = ref(false);
const isMax = ref(false);
const sideTab = ref<'queue' | 'steps'>('queue');

const currentRemainingSec = ref(exercises.value[0]?.durationSec ?? 0);
const tick = ref<number | null>(null);

const muted = ref(false);

const current = computed(() => exercises.value[currentIndex.value] || null);
const upcoming = computed(() => exercises.value.slice(currentIndex.value + 1));

const totalRemainingSec = computed(() => {
  const rest = exercises.value
    .slice(currentIndex.value + 1)
    .reduce((sum, e) => sum + e.durationSec, 0);
  return Math.max(0, currentRemainingSec.value + rest);
});

const currentProgress = computed(() => {
  const dur = current.value?.durationSec ?? 1;
  const left = currentRemainingSec.value;
  return Math.min(1, Math.max(0, (dur - left) / dur));
});

const etaForUpcoming = computed(() => {
  const out: number[] = [];
  let acc = currentRemainingSec.value;
  for (const ex of upcoming.value) {
    out.push(acc);
    acc += ex.durationSec;
  }
  return out;
});

const nextUpCompact = computed(() => {
  const n = upcoming.value[0];
  if (!n) return '—';
  return `${n.name} (${fmt(n.durationSec)})`;
});

async function toggleMaximize() {
  if (!window.electronDeskVitalsAPI) return;
  isMax.value = await window.electronDeskVitalsAPI.toggleMaximize();
}

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : `${ss}s`;
}

function startTicker() {
  stopTicker();
  tick.value = window.setInterval(() => {
    if (isPaused.value) return;

    currentRemainingSec.value -= 1;
    if (currentRemainingSec.value <= 0) advance();
  }, 1000);
}

function stopTicker() {
  if (tick.value) {
    window.clearInterval(tick.value);
    tick.value = null;
  }
}

function advance() {
  if (currentIndex.value >= exercises.value.length - 1 || current.value === null) {
    currentRemainingSec.value = 0;
    isPaused.value = true;
    stopTicker();
    return;
  }
  currentIndex.value += 1;
  currentRemainingSec.value = current.value.durationSec;
}

function skipExercise() {
  advance();
}

function togglePause() {
  isPaused.value = !isPaused.value;
}

async function minimizeFor10() {
  if (!isPaused.value) {
    isPausedByMinimize.value = true;
    isPaused.value = true;
    stopTicker();
  } else {
    isPausedByMinimize.value = false;
  }

  try {
    await window.electronDeskVitalsAPI?.minimizeFor(10);
  } catch (e) {
    console.error(e);
    if (isPausedByMinimize.value) {
      isPaused.value = false;
      isPausedByMinimize.value = false;
      startTicker();
    }
  }
}

function cancelBreak() {
  const wasPaused = isPaused.value;
  isPaused.value = true;

  $q.dialog({
    class: 'dv-dialog',
    title: 'Cancel break?',
    message: 'Your current break will end without reward.',
    ok: { label: 'Cancel break', unelevated: true, color: 'negative', noCaps: true },
    cancel: { label: 'Keep going', flat: true, noCaps: true },
  })
    .onOk(() => {
      try {
        window.close();
      } catch (e) {
        console.error(e);
      }
    })
    .onCancel(() => {
      isPaused.value = wasPaused;
    })
    .onDismiss(() => {
      isPaused.value = wasPaused;
    });
}

function resumeAfterMinimizeIfNeeded() {
  if (!isPausedByMinimize.value) return;

  isPausedByMinimize.value = false;
  isPaused.value = false;
  startTicker();
}

function toggleMute() {
  muted.value = !muted.value;
}

const onFocus = () => resumeAfterMinimizeIfNeeded();
const onVis = () => {
  if (!document.hidden) resumeAfterMinimizeIfNeeded();
};

watch(
  exercises,
  (next, prev) => {
    if (next.length === 0) {
      currentIndex.value = 0;
      currentRemainingSec.value = 0;
      isPaused.value = true;
      stopTicker();
      return;
    }

    if (currentIndex.value > next.length - 1) {
      currentIndex.value = next.length - 1;
      const boundedExercise = next[currentIndex.value];
      if (!boundedExercise) return;

      currentRemainingSec.value = boundedExercise.durationSec;
      return;
    }

    const currentExercise = next[currentIndex.value];
    if (!currentExercise) return;

    if (!prev || prev[currentIndex.value]?.id !== currentExercise.id) {
      currentRemainingSec.value = currentExercise.durationSec;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  if (window.electronDeskVitalsAPI?.isMaximized) {
    isMax.value = await window.electronDeskVitalsAPI.isMaximized();
  }

  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('focus', onFocus);

  currentRemainingSec.value = current.value?.durationSec ?? 0;
  startTicker();
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVis);
  window.removeEventListener('focus', onFocus);

  stopTicker();
});
</script>

<style scoped>
.exercise {
  height: 100%;
  overflow: hidden;
}

.ex-card {
  height: 100%;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  box-shadow:
    0 22px 70px rgba(var(--bg-0-rgb), 0.55),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}

.topbar {
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background:
    radial-gradient(900px 250px at 30% -10%, rgba(var(--accent-1-rgb), 0.12), transparent 60%),
    rgba(var(--bg-0-rgb), 0.18);
  backdrop-filter: blur(10px);
}

.tb-title {
  font-weight: 950;
  font-size: 18px;
  letter-spacing: -0.2px;
}
.tb-sub {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: rgba(var(--txt-1-rgb), 0.03);
  color: rgba(var(--txt-1-rgb), 0.78);
  font-size: 12px;
  font-weight: 800;
}
.pill.muted {
  color: rgba(var(--txt-1-rgb), 0.6);
}

.tb-right {
  display: flex;
  gap: 10px;
  align-items: center;
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
  font-size: 15px;
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

.danger {
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(255, 90, 90, 0.25);
  background: rgba(255, 90, 90, 0.08);
  color: rgba(var(--txt-1-rgb), 0.9);
}
.danger:hover {
  background: rgba(255, 90, 90, 0.12);
}

.content {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 14px;
  padding: 14px;
}

.left {
  min-height: 0;
}

.viewer {
  height: 100%;
  min-height: 0;
  border-radius: var(--dv-radius-xl);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background:
    radial-gradient(900px 400px at 40% 10%, rgba(var(--accent-1-rgb), 0.1), transparent 60%),
    rgba(var(--bg-0-rgb), 0.2);
  box-shadow: inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.viewer-head {
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  border-bottom: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
}

.ex-name {
  font-weight: 950;
  font-size: 18px;
  color: rgba(var(--txt-1-rgb), 0.9);
}

.ex-meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.big-time {
  text-align: right;
  font-size: 26px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.9);
}
.small-time {
  margin-top: 4px;
  text-align: right;
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.55);
}

.viewer-stage {
  position: relative;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 10px;
}

.stage-img {
  width: 100%;
  height: 100%;
  border-radius: 22px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.07);
  background:
    radial-gradient(700px 380px at 30% 20%, rgba(var(--accent-5-rgb), 0.07), transparent 60%),
    rgba(var(--bg-15-rgb), 0.65);
  box-shadow:
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04),
    0 22px 80px rgba(var(--bg-0-rgb), 0.45);
  overflow: hidden;
}

.stage-img :deep(img) {
  padding: 0;
}

.stage-overlay {
  position: absolute;
  inset: 14px;
  pointer-events: none;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
}

.stage-badge {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.12);
  background: rgba(var(--bg-0-rgb), 0.35);
  backdrop-filter: blur(10px);
  color: rgba(var(--txt-1-rgb), 0.9);
  font-weight: 900;
  font-size: 12px;
}
.stage-badge.paused {
  border-color: rgba(var(--accent-1-rgb), 0.3);
  box-shadow: 0 0 0 3px rgba(var(--accent-1-rgb), 0.1);
}

.stage-progress {
  align-self: end;
}

.viewer-foot {
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
}

.right {
  min-height: 0;
}

.side-card {
  height: 100%;
  min-height: 0;
  border-radius: var(--dv-radius-xl);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--bg-0-rgb), 0.18);
  box-shadow: inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}

.side-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
}

.tab-btn {
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  color: rgba(var(--txt-1-rgb), 0.62);
  font-weight: 900;
}
.tab-btn:hover {
  background: rgba(var(--txt-1-rgb), 0.05);
}
.tab-btn.active {
  background: rgba(var(--txt-1-rgb), 0.06);
  color: rgba(var(--txt-1-rgb), 0.85);
  border-color: rgba(var(--txt-1-rgb), 0.14);
}

.queue {
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.queue-head {
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(var(--txt-1-rgb), 0.06);
}

.t1 {
  font-weight: 950;
  font-size: 16px;
}
.t2 {
  margin-top: 4px;
  color: rgba(var(--txt-1-rgb), 0.62);
  font-size: 12px;
  font-weight: 800;
}

.queue-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  color: rgba(var(--txt-1-rgb), 0.75);
  font-weight: 900;
  font-size: 12px;
}

.queue-list {
  min-height: 0;
  overflow: auto;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.q-item {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 10px;
  align-items: center;
  min-height: 74px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.07);
  background: rgba(var(--txt-1-rgb), 0.02);
}
.q-item.soon {
  border-color: rgba(var(--accent-1-rgb), 0.22);
  background:
    radial-gradient(260px 160px at 20% 20%, rgba(var(--accent-1-rgb), 0.12), transparent 60%),
    rgba(var(--txt-1-rgb), 0.02);
}

.q-thumb {
  width: 64px;
  height: 54px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: rgba(var(--bg-0-rgb), 0.22);
  overflow: hidden;
  display: grid;
  place-items: center;
}
.q-thumb .q-img {
  width: 64px;
  height: 54px;
}

.q-name {
  font-weight: 950;
  font-size: 13px;
  color: rgba(var(--txt-1-rgb), 0.86);
}
.q-sub {
  margin-top: 4px;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.muted {
  color: rgba(var(--txt-1-rgb), 0.58);
  font-weight: 800;
}
.dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(var(--txt-1-rgb), 0.25);
}

.q-right {
  justify-self: end;
}
.q-eta {
  font-size: 12px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.75);
}

.queue-empty {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.07);
  background: rgba(var(--txt-1-rgb), 0.02);
  color: rgba(var(--txt-1-rgb), 0.7);
}
.qe-title {
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.86);
}
.qe-sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.58);
  font-weight: 800;
}

.queue-foot {
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  border-top: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
}

.qf-left {
  display: grid;
  gap: 4px;
}
.qf-label {
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.55);
  font-weight: 900;
}
.qf-val {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.85);
}

.stepsPanel {
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}

.steps-head {
  padding: 12px;
  border-bottom: 1px solid rgba(var(--txt-1-rgb), 0.06);
}

.steps-meta {
  padding: 12px;
  display: grid;
  gap: 8px;
  border-bottom: 1px solid rgba(var(--txt-1-rgb), 0.06);
}
.meta-row {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
}
.meta-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
}
.meta-label {
  font-size: 12px;
  font-weight: 900;
  color: rgba(var(--txt-1-rgb), 0.62);
}
.meta-val {
  font-size: 12px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.82);
}

.steps-list {
  margin: 0;
  padding: 12px;
  list-style: none;
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 10px;
}

.step {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.07);
  background: rgba(var(--bg-0-rgb), 0.18);
}
.step-n {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 950;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.9);
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--accent-1-rgb), 0.1);
}
.step-t {
  color: rgba(var(--txt-1-rgb), 0.78);
  font-weight: 800;
  font-size: 13px;
  line-height: 1.35;
}

.hint {
  margin: 12px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.hx-ico {
  margin-top: 1px;
  color: rgba(var(--accent-1-rgb), 0.85);
}
.hint-t {
  color: rgba(var(--txt-1-rgb), 0.7);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
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

@media (max-height: 650px) {
  .hint {
    display: none;
  }
}
</style>

<style>
.dv-dialog.q-card {
  border-radius: var(--dv-radius-xl);
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  box-shadow:
    0 22px 70px rgba(var(--bg-0-rgb), 0.55),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  color: var(--txt-1);
}

.dv-dialog .q-dialog__title {
  font-weight: 950;
  letter-spacing: -0.2px;
  color: rgba(var(--txt-1-rgb), 0.92);
}

.dv-dialog .q-dialog__message {
  color: rgba(var(--txt-1-rgb), 0.7);
  font-weight: 700;
}

.dv-dialog .q-card__actions {
  padding: 12px 16px 16px;
  gap: 10px;
}

.dv-dialog .q-btn {
  border-radius: 999px;
  font-weight: 950;
}
</style>
