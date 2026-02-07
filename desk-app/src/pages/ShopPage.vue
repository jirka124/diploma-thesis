<template>
  <div class="shop">
    <section class="shop-card">
      <div class="shop-inner">
        <!-- LEFT -->
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

          <div class="coins-box">
            <div class="coins-left">
              <q-icon name="paid" size="18px" class="coins-ico" />
              <div class="coins-text">
                <div class="coins-title">Coins</div>
                <div class="coins-sub">Spend wisely</div>
              </div>
            </div>
            <div class="coins-val">{{ coins }}</div>
          </div>

          <q-tabs v-model="tab" vertical class="v-tabs" indicator-color="transparent" no-caps>
            <q-tab name="avatars">
              <div class="tab-row">
                <q-icon name="face" size="18px" class="tab-ico" />

                <div class="tab-main">
                  <span class="tab-text">Avatars</span>
                </div>

                <span class="tab-count">
                  <span class="tab-count-n">{{ ownedAvatars.size }}</span>
                  <span class="tab-count-s">/</span>
                  <span class="tab-count-t">{{ avatars.length }}</span>
                </span>
              </div>
            </q-tab>

            <q-tab name="themes">
              <div class="tab-row">
                <q-icon name="palette" size="18px" class="tab-ico" />

                <div class="tab-main">
                  <span class="tab-text">Themes</span>
                </div>

                <span class="tab-count">
                  <span class="tab-count-n">{{ ownedThemes.size }}</span>
                  <span class="tab-count-s">/</span>
                  <span class="tab-count-t">{{ themes.length }}</span>
                </span>
              </div>
            </q-tab>
          </q-tabs>
        </aside>

        <!-- RIGHT -->
        <main class="panel">
          <q-tab-panels v-model="tab" animated class="panels">
            <!-- AVATARS -->
            <q-tab-panel name="avatars" class="p">
              <div class="p-head">
                <div class="p-title">Avatars</div>
                <div class="p-sub">Buy new app characters</div>
              </div>

              <div class="grid shop-grid">
                <div v-for="a in avatars" :key="a.id" class="card avatar-card">
                  <div class="avatar-top">
                    <div class="avatar-poster" :class="{ owned: isAvatarOwned(a.id) }">
                      <q-img :src="a.img" :ratio="2 / 3" class="avatar-img" />
                    </div>

                    <div class="avatar-meta">
                      <div class="avatar-body">
                        <div class="avatar-head">
                          <div class="avatar-name">{{ a.name }}</div>
                        </div>

                        <div class="avatar-desc">{{ a.desc }}</div>

                        <div class="avatar-features">
                          <div v-for="feat in a.features" :key="feat.icon + feat.text" class="feat">
                            <q-icon :name="feat.icon" size="16px" class="feat-ico" />
                            <span>{{ feat.text }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="avatar-foot">
                        <div class="avatar-footLeft">
                          <span v-if="isAvatarOwned(a.id)" class="pill owned">
                            <q-icon name="check_circle" size="16px" class="pill-ico" />
                            Owned
                          </span>
                          <span v-else class="pill price">
                            <q-icon name="paid" size="16px" class="pill-ico" />
                            {{ a.price }}
                          </span>
                        </div>

                        <q-btn
                          no-caps
                          unelevated
                          class="buy-mini"
                          icon="shopping_cart"
                          :disable="isAvatarOwned(a.id) || !canAfford(a.price)"
                          :label="
                            isAvatarOwned(a.id)
                              ? 'Owned'
                              : canAfford(a.price)
                                ? 'Buy'
                                : 'Not enough'
                          "
                          @click="buyAvatar(a.id)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="hint">
                Buying unlocks the character for permanent use through settings.
              </div>
            </q-tab-panel>

            <!-- THEMES -->
            <q-tab-panel name="themes" class="p">
              <div class="p-head">
                <div class="p-title">Themes</div>
                <div class="p-sub">Buy accent palettes</div>
              </div>

              <div class="grid theme-grid">
                <div class="card wide">
                  <div class="theme-chip-grid">
                    <div v-for="t in themes" :key="t.key" class="theme-row">
                      <button
                        type="button"
                        class="theme-chip"
                        :class="{ active: theme.accent.value === t.key }"
                        @click="previewTheme(t.key)"
                        :aria-label="`Preview theme ${t.label}`"
                      >
                        <span class="theme-swatch-box" :style="swatchStyle(t.key)"></span>

                        <div class="theme-mid">
                          <div class="theme-name">
                            {{ t.label }}
                            <q-icon
                              v-if="theme.accent.value === t.key"
                              name="visibility"
                              size="16px"
                              class="theme-eye"
                            />
                          </div>
                          <div class="theme-sub">
                            {{ themeSubText(t.key) }}
                          </div>
                        </div>

                        <div class="theme-right">
                          <span v-if="isThemeOwned(t.key)" class="pill owned">
                            <q-icon name="check_circle" size="16px" class="pill-ico" />
                            Owned
                          </span>
                          <span v-else class="pill price">
                            <q-icon name="paid" size="16px" class="pill-ico" />
                            {{ t.price }}
                          </span>
                        </div>
                      </button>

                      <q-btn
                        no-caps
                        unelevated
                        class="buy-mini"
                        icon="shopping_cart"
                        :disable="!canAfford(t.price)"
                        label="Buy"
                        @click="buyTheme(t.key)"
                        v-show="!isThemeOwned(t.key)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="hint">
                Preview allows for changing accent for a time of 10s, afterwards saved accent is
                used again. Buying unlocks the pallete for permanent use through settings.
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  useTheme,
  ACCENT_ORDER,
  ACCENT_LABEL,
  getAccentStops,
  type Accent,
} from 'src/composables/theme';

type TabKey = 'avatars' | 'themes';
type AvatarId = 'default' | 'runner' | 'warrior' | 'mage';

const router = useRouter();
const tab = ref<TabKey>('avatars');

const theme = useTheme();
const tick = ref(0);
const coins = ref<number>(420);
let tickTimer: number | null = null;

const avatars = ref<
  Array<{
    id: AvatarId;
    name: string;
    desc: string;
    price: number;
    img: string;
    features: { icon: string; text: string }[];
  }>
>([
  {
    id: 'default',
    name: 'Default',
    desc: 'Starter avatar',
    price: 0,
    img: `/src/assets/demo-avatar-default.png`,
    features: [{ icon: 'person', text: 'human' }],
  },
  {
    id: 'runner',
    name: 'Runner',
    desc: 'Light & sporty',
    price: 120,
    img: `/src/assets/demo-avatar-runner.png`,
    features: [
      { icon: 'person', text: 'human' },
      { icon: 'workspace_premium', text: 'PRO' },
    ],
  },
]);

const ownedAvatars = ref<Set<AvatarId>>(new Set(['default']));

const THEME_PRICE: Record<Accent, number> = {
  pink: 180,
  blue: 180,
  green: 180,
  amber: 180,
};

const themes = computed(() =>
  ACCENT_ORDER.map((k) => ({
    key: k,
    label: ACCENT_LABEL[k],
    price: THEME_PRICE[k],
  })),
);

const ownedThemes = ref<Set<Accent>>(new Set([theme.accent.value]));

function canAfford(price: number) {
  return coins.value >= price;
}

function isAvatarOwned(id: AvatarId) {
  return ownedAvatars.value.has(id);
}

function isThemeOwned(key: Accent) {
  return ownedThemes.value.has(key);
}

function themeSubText(key: Accent) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  tick.value;

  const preview = theme.preview.value;

  if (preview && preview.accent === key) {
    const now = Date.now();
    const end = preview.timestamp.getTime();

    const secondsLeft = Math.max(0, Math.ceil((end - now) / 1000));

    return `Preview (${secondsLeft}s)`;
  }

  return 'Click to preview';
}

function buyAvatar(id: AvatarId) {
  if (isAvatarOwned(id)) return;

  const item = avatars.value.find((x) => x.id === id);
  if (!item) return;

  const price = item.price;
  if (!canAfford(price)) return;

  coins.value -= price;
  ownedAvatars.value = new Set([...ownedAvatars.value, id]);
}

function buyTheme(key: Accent) {
  if (isThemeOwned(key)) return;

  const item = themes.value.find((x) => x.key === key);
  if (!item) return;

  const price = item.price;
  if (!canAfford(price)) return;

  coins.value -= price;
  ownedThemes.value = new Set([...ownedThemes.value, key]);
}

function previewTheme(key: Accent) {
  theme.previewAccent(key);
}

function swatchStyle(a: Accent) {
  const s = getAccentStops(a, theme.mode.value);
  return {
    background: `linear-gradient(90deg, rgba(${s.a1}, .95), rgba(${s.a4}, .90), rgba(${s.a5}, .70))`,
  };
}

async function goBack() {
  if (window.history.length > 1) router.back();
  else await router.push({ name: 'index' });
}

watch(
  () => theme.preview.value,
  (p) => {
    if (p && !tickTimer) {
      tickTimer = window.setInterval(() => tick.value++, 100);
    }
    if (!p && tickTimer) {
      window.clearInterval(tickTimer);
      tickTimer = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (tickTimer) window.clearInterval(tickTimer);
});
</script>

<style scoped>
.shop {
  min-height: 100%;
}

.shop-card {
  min-height: 100%;
  border-radius: var(--dv-radius-xl);
  overflow: hidden;
}

.shop-inner {
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
  grid-template-rows: auto auto 1fr;
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

.coins-box {
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--bg-0-rgb), 0.18);
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.coins-left {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.coins-ico {
  color: rgba(var(--accent-1-rgb), 0.9);
}

.coins-title {
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.88);
  font-size: 13px;
}
.coins-sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.58);
  font-weight: 800;
}

.coins-val {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.9);
  font-size: 12px;
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
.v-tabs :deep(.q-tab--active) {
  background: rgba(var(--txt-1-rgb), 0.06);
  color: rgba(var(--txt-1-rgb), 0.88);
  border-color: rgba(var(--txt-1-rgb), 0.12);
}
.v-tabs :deep(.q-tab:hover) {
  background: rgba(var(--txt-1-rgb), 0.04);
}

.tab-row {
  width: 100%;
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 10px;
  align-items: center;
}
.tab-main {
  min-width: 0;
}
.tab-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
}
.tab-text {
  font-weight: 950;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-count {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--bg-0-rgb), 0.18);
  color: rgba(var(--txt-1-rgb), 0.82);
  font-size: 12px;
  font-weight: 950;
  line-height: 1;
}

.tab-count-n {
  color: rgba(var(--txt-1-rgb), 0.92);
}

.tab-count-s {
  color: rgba(var(--txt-1-rgb), 0.45);
  font-weight: 900;
}

.tab-count-t {
  color: rgba(var(--txt-1-rgb), 0.7);
  font-weight: 900;
}

.v-tabs :deep(.q-tab--active) .tab-count {
  border-color: rgba(var(--accent-1-rgb), 0.35);
  background: rgba(var(--accent-1-rgb), 0.12);
  color: rgba(var(--txt-1-rgb), 0.92);
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

.shop-grid {
  align-items: stretch;
}
@media (max-width: 1120px) {
  .shop-grid {
    grid-template-columns: 1fr;
  }
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

.avatar-img {
  border-radius: 24px;
}
.avatar-img :deep(img) {
  object-fit: cover;
  object-position: center top;
  transform: scale(1.02);
}

.avatar-top {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 14px;
  align-items: stretch;
}

@media (max-width: 1120px) {
  .avatar-top {
    grid-template-columns: 170px 1fr;
  }
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.6);
}

.theme-grid {
  grid-template-columns: 1fr;
}

.theme-chip-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 1120px) {
  .theme-chip-grid {
    grid-template-columns: 1fr;
  }
}

.theme-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.theme-chip {
  width: 100%;
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: rgba(var(--bg-0-rgb), 0.18);
  cursor: pointer;
  color: rgba(var(--txt-1-rgb), 0.78);
  text-align: left;
}

.theme-chip:hover {
  border-color: rgba(var(--txt-1-rgb), 0.12);
  background: rgba(var(--txt-1-rgb), 0.03);
}

.theme-chip.active {
  border-color: rgba(var(--accent-1-rgb), 0.45);
  background: linear-gradient(180deg, rgba(var(--txt-1-rgb), 0.04), rgba(var(--bg-0-rgb), 0.18));
}

.theme-mid {
  min-width: 0;
}

.theme-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 950;
  font-size: 13px;
  color: rgba(var(--txt-1-rgb), 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-eye {
  color: rgba(var(--accent-1-rgb), 0.95);
}

.theme-sub {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.58);
}

.theme-right {
  display: flex;
  align-items: center;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  font-weight: 950;
  font-size: 12px;
  color: rgba(var(--txt-1-rgb), 0.88);
}

.pill.owned {
  border-color: rgba(var(--accent-1-rgb), 0.3);
  background: rgba(var(--accent-1-rgb), 0.14);
}

.pill-ico {
  color: rgba(var(--accent-1-rgb), 0.9);
}

.buy-mini {
  height: 40px;
  border-radius: 18px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  background: rgba(var(--txt-1-rgb), 0.03);
  color: rgba(var(--txt-1-rgb), 0.86);
  font-weight: 950;
  padding: 0 12px;
}

.buy-mini:hover {
  background: rgba(var(--txt-1-rgb), 0.05);
}

.buy-mini :deep(.q-btn__content) {
  gap: 10px;
}

.theme-swatch-box {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.12);
  box-shadow: inset 0 1px 0 rgba(var(--txt-1-rgb), 0.05);
  display: block;
}

.avatar-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.avatar-poster {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background:
    radial-gradient(600px 260px at 30% 15%, rgba(var(--accent-1-rgb), 0.12), transparent 55%),
    rgba(var(--bg-0-rgb), 0.18);
  box-shadow:
    0 18px 55px rgba(var(--bg-0-rgb), 0.45),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.05);
}

.avatar-poster::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 50%, rgba(var(--bg-0-rgb), 0.5));
}

.avatar-poster.owned {
  border-color: rgba(var(--accent-1-rgb), 0.22);
}

.avatar-meta {
  min-width: 0;
  display: grid;
  gap: 10px;
}

.avatar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.avatar-name {
  font-weight: 950;
  font-size: 16px;
  color: rgba(var(--txt-1-rgb), 0.92);
  letter-spacing: 0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-desc {
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.6);
  line-height: 1.45;
}

.avatar-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  background: rgba(var(--bg-0-rgb), 0.18);
  color: rgba(var(--txt-1-rgb), 0.72);
  font-size: 12px;
  font-weight: 900;
}

.feat-ico {
  color: rgba(var(--accent-1-rgb), 0.85);
}

.avatar-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avatar-foot {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--txt-1-rgb), 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.avatar-footLeft {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
