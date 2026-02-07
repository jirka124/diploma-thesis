<template>
  <div class="settings">
    <section class="settings-card">
      <div class="settings-inner">
        <aside class="side">
          <div class="side-nav">
            <q-btn
              no-caps
              unelevated
              class="back-btn"
              icon="arrow_back"
              label="Back"
              @click="goBack()"
            />
          </div>

          <q-tabs v-model="tab" vertical class="v-tabs" indicator-color="transparent" no-caps>
            <q-tab name="general">
              <div class="tab-row">
                <q-icon name="tune" size="18px" class="tab-ico" />
                <span class="tab-text">General</span>
              </div>
            </q-tab>

            <q-tab name="exercises">
              <div class="tab-row">
                <q-icon name="self_improvement" size="18px" class="tab-ico" />
                <span class="tab-text">Exercises</span>
              </div>
            </q-tab>

            <q-tab name="notifications">
              <div class="tab-row">
                <q-icon name="notifications" size="18px" class="tab-ico" />
                <span class="tab-text">Notifications</span>
              </div>
            </q-tab>
          </q-tabs>

          <div class="side-foot">
            <div class="meta-line">
              <q-icon name="info" size="16px" class="meta-ico" />
              <span class="meta-label">Version</span>
              <span class="meta-val">{{ appMeta.version }}</span>
            </div>
            <div class="meta-line">
              <q-icon name="commit" size="16px" class="meta-ico" />
              <span class="meta-label">Build</span>
              <span class="meta-val">{{ appMeta.build }}</span>
            </div>
            <div class="meta-line">
              <q-icon name="workspace_premium" size="16px" class="meta-ico" />
              <span class="meta-label">Tier</span>
              <span class="meta-val">{{ appMeta.tier }}</span>
            </div>
          </div>
        </aside>

        <main class="panel">
          <q-tab-panels v-model="tab" animated class="panels">
            <q-tab-panel name="general" class="p">
              <div class="p-head">
                <div class="p-title">General</div>
                <div class="p-sub">Appearance</div>
              </div>

              <div class="grid general-grid">
                <div class="card">
                  <div class="card-title">
                    <div class="c1">Theme accent</div>
                    <div class="c2">Pick a palette</div>
                  </div>

                  <div class="accent-grid">
                    <button
                      v-for="a in ACCENT_ORDER"
                      :key="a"
                      type="button"
                      class="accent-chip"
                      :class="{ active: accentKey === a }"
                      @click="accentKey = a"
                      :aria-label="`Accent ${ACCENT_LABEL[a]}`"
                    >
                      <span class="swatch" :style="swatchStyle(a)"></span>
                      <span class="chip-label">{{ ACCENT_LABEL[a] }}</span>
                      <q-icon
                        v-if="accentKey === a"
                        name="check_circle"
                        size="18px"
                        class="chip-check"
                      />
                    </button>
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">
                    <div class="c1">Mode</div>
                    <div class="c2">Switch between light / dark</div>
                  </div>

                  <div class="mode-row">
                    <div class="mode-pill">
                      <q-icon
                        :name="darkMode ? 'dark_mode' : 'light_mode'"
                        size="18px"
                        class="mode-ico"
                      />
                      <div class="mode-text">
                        <div class="mode-name">{{ darkMode ? 'Dark' : 'Light' }}</div>
                        <div class="mode-desc">
                          {{ darkMode ? 'Shades of black-gray' : 'Shades of white-gray' }}
                        </div>
                      </div>
                    </div>

                    <q-toggle
                      v-model="darkMode"
                      keep-color
                      :label="$q.dark.isActive ? 'Disable dark mode' : 'Enable dark mode'"
                      class="mode-toggle"
                    />
                  </div>

                  <div class="hint">
                    We recommend using
                    <span class="mono">dark mode</span> as it is easier on your eyes and your
                    battery too.
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="exercises" class="p">
              <div class="p-head">
                <div class="p-title">Exercises</div>
                <div class="p-sub">Break cadence & intensity</div>
              </div>

              <div class="grid">
                <div class="card wide">
                  <div class="card-title">
                    <div class="c1">Potential Health Index</div>
                    <div class="c2">Estimated outcome from your current settings</div>
                  </div>

                  <div class="hi-wrap">
                    <div class="hi-ring">
                      <q-circular-progress
                        rounded
                        :value="potentialHealthIndex"
                        size="160px"
                        :thickness="0.14"
                        track-color="white"
                        class="ring-q ring-accent"
                        show-value
                      >
                        <div class="ring-inner">
                          <div class="ring-value">{{ potentialHealthIndex }}</div>
                          <div class="ring-label">POTENTIAL</div>
                          <div class="ring-state">{{ potentialLabel }}</div>
                        </div>
                      </q-circular-progress>
                    </div>

                    <div class="hi-text">
                      <div class="hi-title">What improves it?</div>
                      <div class="hi-list">
                        <div class="hi-li">
                          <q-icon name="schedule" size="16px" class="hx-ico" />
                          <span>More frequent breaks</span>
                        </div>
                        <div class="hi-li">
                          <q-icon name="fitness_center" size="16px" class="hx-ico" />
                          <span>More exercises per break</span>
                        </div>
                      </div>
                    </div>

                    <div class="hint">
                      Health index is just an indicator, we recommand aiming for routine that suits
                      you personaly best.
                    </div>
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">
                    <div class="c1">Break frequency</div>
                    <div class="c2">How often should a break start?</div>
                  </div>

                  <div class="slider-head">
                    <div class="slider-k">Interval</div>
                    <div class="slider-v">
                      <span class="badge">{{ breakEveryMin }} min</span>
                    </div>
                  </div>

                  <q-slider
                    v-model="breakEveryMin"
                    :min="5"
                    :max="120"
                    :step="5"
                    label
                    label-always
                    track-color="rgba(255,255,255,0.06)"
                    class="dv-slider"
                  />

                  <div class="hint">Recommended range: <span class="mono">20–60 min</span>.</div>
                </div>

                <div class="card">
                  <div class="card-title">
                    <div class="c1">Exercises per break</div>
                    <div class="c2">How many short exercises to run</div>
                  </div>

                  <div class="slider-head">
                    <div class="slider-k">Count</div>
                    <div class="slider-v">
                      <span class="badge">{{ exercisesPerBreak }}</span>
                    </div>
                  </div>

                  <q-slider
                    v-model="exercisesPerBreak"
                    :min="1"
                    :max="3"
                    :step="1"
                    markers
                    snap
                    label
                    label-always
                    track-color="rgba(255,255,255,0.06)"
                    class="dv-slider"
                  />

                  <div class="hint">Keep it realistic - 1 done consistently beats 3 skipped.</div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="notifications" class="p">
              <div class="p-head">
                <div class="p-title">Notifications</div>
                <div class="p-sub">System alerts before a break</div>
              </div>

              <div class="grid">
                <div class="card wide">
                  <div class="card-title">
                    <div class="c1">System notifications</div>
                    <div class="c2">Notify 10s before break starts</div>
                  </div>

                  <div class="noti-row">
                    <div class="noti-pill">
                      <q-icon name="notifications_active" size="18px" class="mode-ico" />
                      <div class="mode-text">
                        <div class="mode-name">
                          {{ notificationsEnabled ? 'Enabled' : 'Disabled' }}
                        </div>
                        <div class="mode-desc">Uses OS notifications</div>
                      </div>
                    </div>

                    <q-toggle
                      v-model="notificationsEnabled"
                      keep-color
                      :label="
                        notificationsEnabled ? 'Disable notifications' : 'Enable notifications'
                      "
                      class="mode-toggle"
                    />
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  useTheme,
  ACCENT_ORDER,
  ACCENT_LABEL,
  getAccentStops,
  type Accent,
} from 'src/composables/theme';

type TabKey = 'general' | 'exercises' | 'notifications';

const router = useRouter();

const tab = ref<TabKey>('general');

const appMeta = ref({
  version: 'x.x.x',
  build: 'yyyy.mm.dd',
  tier: 'XXX',
});

const breakEveryMin = ref<number>(30);
const exercisesPerBreak = ref<number>(2);

const notificationsEnabled = ref<boolean>(true);

const theme = useTheme();

const darkMode = computed({
  get: () => theme.mode.value === 'dark',
  set: (val: boolean) => theme.setMode(val ? 'dark' : 'light'),
});

const accentKey = computed({
  get: () => theme.accent.value,
  set: (val: Accent) => theme.setAccent(val),
});

function swatchStyle(a: Accent) {
  const s = getAccentStops(a, theme.mode.value);
  return {
    background: `linear-gradient(90deg, rgba(${s.a1}, .95), rgba(${s.a4}, .90), rgba(${s.a5}, .70))`,
  };
}

const potentialHealthIndex = computed(() => {
  const maxM = 120;
  const capAt = 30;

  const m = breakEveryMin.value;

  let freqScore = 0;
  if (m <= capAt) {
    freqScore = 1;
  } else {
    freqScore = 1 - (m - capAt) / (maxM - capAt);
  }
  freqScore = Math.max(0, Math.min(1, freqScore));

  const e = exercisesPerBreak.value;
  let exScore = (e / m) * 10;
  exScore = Math.max(0, Math.min(1, exScore));
  const raw = 0.72 * freqScore + 0.28 * exScore;
  const curved = Math.pow(raw, 0.95);

  return Math.max(0, Math.min(100, Math.round(curved * 100)));
});

const potentialLabel = computed(() => {
  const v = potentialHealthIndex.value;
  if (v >= 85) return 'Excellent';
  if (v >= 70) return 'Great';
  if (v >= 55) return 'Good';
  if (v >= 40) return 'Fair';
  return 'Low';
});

async function goBack() {
  if (window.history.length > 1) router.back();
  else await router.push({ name: 'index' });
}
</script>

<style scoped>
.settings {
  min-height: 100%;
}

.settings-card {
  min-height: 100%;
  border-radius: var(--dv-radius-xl);
  overflow: hidden;
}

.settings-inner {
  min-height: 100%;
  padding: 16px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 14px;
}

.side {
  border-radius: var(--dv-radius-xl);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  box-shadow:
    0 22px 70px rgba(var(--bg-0-rgb), 0.55),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  padding: 12px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  min-height: 0;
}

.side-nav {
  display: flex;
  align-items: center;
}

.back-btn {
  width: 100%;
  height: 40px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  color: rgba(var(--txt-1-rgb), 0.82);
  font-weight: 950;
  justify-content: flex-start;
  padding-left: 10px;
}
.back-btn:hover {
  background: rgba(var(--txt-1-rgb), 0.05);
}
.back-btn :deep(.q-btn__content) {
  justify-content: flex-start;
  width: 100%;
  gap: 10px;
}

.v-tabs {
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--bg-0-rgb), 0.18);
  padding: 6px;
  min-height: 0;
}

.v-tabs :deep(.q-tab) {
  justify-content: flex-start;
  border-radius: 14px;
  margin: 4px 0;
  min-height: 44px;
  border: 1px solid transparent;
  color: rgba(var(--txt-1-rgb), 0.68);
  font-weight: 900;
  letter-spacing: 0.1px;
  padding: 0 10px;
}

.tab-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tab-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
}

.tab-text {
  font-weight: 950;
  font-size: 13px;
}

.v-tabs :deep(.q-tab--active) {
  background: rgba(var(--txt-1-rgb), 0.06);
  color: rgba(var(--txt-1-rgb), 0.88);
  border-color: rgba(var(--txt-1-rgb), 0.12);
}
.v-tabs :deep(.q-tab:hover) {
  background: rgba(var(--txt-1-rgb), 0.04);
}

.side-foot {
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
  padding: 10px;
}

.meta-line {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 8px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--bg-0-rgb), 0.18);
  margin-bottom: 8px;
}
.meta-line:last-child {
  margin-bottom: 0;
}

.meta-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
}
.meta-label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.62);
}
.meta-val {
  font-size: 12px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.86);
}

.panel {
  border-radius: var(--dv-radius-xl);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  box-shadow:
    0 22px 70px rgba(var(--bg-0-rgb), 0.55),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);
  padding: 12px;
  min-height: 0;
}

.panels {
  border-radius: 22px;
  background: rgba(var(--bg-0-rgb), 0.14);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  min-height: 0;
}

.p {
  padding: 12px;
}

.p-head {
  padding: 10px 10px 12px;
}
.p-title {
  font-weight: 950;
  font-size: 18px;
  color: rgba(var(--txt-1-rgb), 0.9);
}
.p-sub {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.58);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card.wide {
  grid-column: 1 / -1;
}

.card {
  border-radius: 22px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
  padding: 12px;
  box-shadow:
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04),
    inset 0 -18px 30px rgba(var(--bg-0-rgb), 0.3);
}

.general-grid {
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 1120px) {
  .general-grid {
    grid-template-columns: 1fr;
  }
}

.card-title {
  margin-bottom: 10px;
}
.c1 {
  font-weight: 950;
  font-size: 14px;
  color: rgba(var(--txt-1-rgb), 0.88);
}
.c2 {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.58);
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.6);
}
.mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.76);
}

.accent-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.accent-chip {
  width: 100%;
  display: grid;
  grid-template-columns: 34px 1fr 22px;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: rgba(var(--bg-0-rgb), 0.18);
  cursor: pointer;
  color: rgba(var(--txt-1-rgb), 0.78);
}
.accent-chip:hover {
  border-color: rgba(var(--txt-1-rgb), 0.12);
  background: rgba(var(--txt-1-rgb), 0.03);
}
.accent-chip.active {
  border-color: rgba(var(--accent-1-rgb), 0.45);
  background: linear-gradient(180deg, rgba(var(--txt-1-rgb), 0.04), rgba(var(--bg-0-rgb), 0.18));
}
.swatch {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.12);
  box-shadow: inset 0 1px 0 rgba(var(--txt-1-rgb), 0.05);
}
.chip-label {
  font-weight: 950;
  font-size: 13px;
}
.chip-check {
  color: rgba(var(--accent-1-rgb), 0.95);
}

.mode-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.noti-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  align-items: center;
}

.mode-pill,
.noti-pill {
  flex: 1 1 340px;
  min-width: 280px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.07);
  background: rgba(var(--bg-0-rgb), 0.22);
  padding: 10px;
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 10px;
  align-items: center;
}

.mode-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
}

.mode-text .mode-name {
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.88);
  font-size: 13px;
}
.mode-text .mode-desc {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.58);
  font-weight: 800;
}

.mode-toggle {
  flex: 0 1 auto;
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: rgba(var(--txt-1-rgb), 0.02);
}

.slider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.slider-k {
  font-size: 12px;
  font-weight: 900;
  color: rgba(var(--txt-1-rgb), 0.62);
}
.badge {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.88);
  font-size: 12px;
}
.dv-slider {
  padding: 4px 2px 0;
}
.dv-slider :deep(.q-slider__thumb) {
  box-shadow: 0 10px 30px rgba(var(--accent-1-rgb), 0.18);
}

.hi-wrap {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 14px;
  align-items: center;
}
.hi-wrap .hint {
  grid-column: 1 / -1;
}
.hi-title {
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.88);
  margin-bottom: 8px;
}
.hi-list {
  display: grid;
  gap: 8px;
}
.hi-li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
  color: rgba(var(--txt-1-rgb), 0.7);
  font-size: 12px;
  font-weight: 800;
}
.hx-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
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
  font-size: 42px;
  font-weight: 950;
  letter-spacing: -1px;
  color: rgba(var(--accent-1-rgb), 0.95);
}
.ring-label {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.9px;
  color: rgba(var(--txt-1-rgb), 0.78);
}
.ring-state {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.66);
}
</style>
