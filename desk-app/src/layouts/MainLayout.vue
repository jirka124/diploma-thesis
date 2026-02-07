<template>
  <div class="dv-root">
    <q-bar class="dv-topbar q-electron-drag">
      <!-- LEFT -->
      <div class="left q-electron-drag">
        <q-icon name="medical_services" size="18px" class="app-icon" />
        <div class="app-title">
          {{ appTitle }} <q-badge transparent rounded align="top">PoC</q-badge>
        </div>
      </div>

      <q-space />

      <!-- RIGHT -->
      <div class="right">
        <q-btn dense flat round class="icon-btn" aria-label="Menu" icon="menu">
          <q-menu
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            transition-show="jump-down"
            transition-hide="jump-up"
            class="dv-menu"
          >
            <div class="dv-menu-inner">
              <div class="dv-menu-head">
                <div class="dv-menu-title">Menu</div>
                <div class="dv-menu-sub">DeskVitals</div>
              </div>

              <div class="dv-menu-list">
                <q-btn
                  dense
                  flat
                  class="dv-menu-item"
                  icon="settings"
                  label="Settings"
                  :to="{ name: 'settings' }"
                />
                <q-btn
                  dense
                  flat
                  class="dv-menu-item"
                  icon="shopping_bag"
                  label="Shop"
                  :to="{ name: 'shop' }"
                />
              </div>
            </div>
          </q-menu>
        </q-btn>

        <div class="win-controls">
          <q-btn
            dense
            flat
            class="win-btn"
            icon="minimize"
            aria-label="Minimize"
            @click="minimize"
          />
          <q-btn
            dense
            flat
            class="win-btn"
            :icon="isMax ? 'mdi-window-restore' : 'mdi-window-maximize'"
            aria-label="Maximize"
            @click="toggleMaximize"
          />
          <q-btn
            dense
            flat
            class="win-btn close"
            icon="close"
            aria-label="Close"
            @click="closeApp"
          />
        </div>
      </div>
    </q-bar>

    <main class="dv-content dv-scroll-area">
      <router-view />
    </main>

    <footer class="dv-footer">
      <div class="dv-footer-accent" aria-hidden="true"></div>

      <div class="dv-footer-items">
        <div class="dv-footer-item" title="Coins">
          <q-icon name="paid" size="18px" class="dv-footer-icon" />
          <span class="dv-footer-value">1,240</span>
        </div>

        <div class="dv-footer-sep" aria-hidden="true"></div>

        <div class="dv-footer-item" title="Trophies">
          <q-icon name="emoji_events" size="18px" class="dv-footer-icon" />
          <span class="dv-footer-value">25K</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const isMax = ref(false);

const appTitle = computed(() => {
  if (router.currentRoute.value.name === 'settings') return 'DV Settings';
  if (router.currentRoute.value.name === 'shop') return 'DV Shop';
  return 'DeskVitals';
});

onMounted(async () => {
  if (window.electronDeskVitalsAPI) isMax.value = await window.electronDeskVitalsAPI.isMaximized();
});

function minimize() {
  if (process.env.MODE === 'electron') {
    window.electronDeskVitalsAPI?.minimize();
  }
}

async function toggleMaximize() {
  if (!window.electronDeskVitalsAPI) return;
  isMax.value = await window.electronDeskVitalsAPI.toggleMaximize();
}

function closeApp() {
  if (process.env.MODE === 'electron') {
    window.electronDeskVitalsAPI?.close();
  }
}
</script>

<style scoped>
.dv-root {
  height: 100%;
  display: grid;
  grid-template-rows: 48px 1fr 34px;
  min-height: 0;
}

.dv-topbar {
  height: 48px;
  padding: 0 12px;
  background: linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  border-bottom: 1px solid rgba(var(--bg-40-rgb), 0.55);
  box-shadow: 0 10px 26px rgba(var(--bg-0-rgb), 0.35);
  backdrop-filter: blur(10px);
}

.left,
.right,
.icon-btn,
.win-controls,
.win-btn,
.dv-menu {
  -webkit-app-region: no-drag;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-icon {
  color: rgba(var(--accent-1-rgb), 0.95);
}

.app-title {
  font-weight: 900;
  letter-spacing: 0.2px;
  color: rgba(var(--accent-1-rgb), 0.95);
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  color: rgba(var(--txt-1-rgb), 0.82);
}

.win-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.win-btn {
  color: rgba(var(--txt-1-rgb), 0.84);
  border-radius: 10px;
  width: 38px;
  height: 30px;
}

.win-btn:hover {
  background: rgba(var(--txt-1-rgb), 0.06);
}

.win-btn.close:hover {
  background: rgba(var(--accent-1-rgb), 0.22);
}

.dv-content {
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: linear-gradient(
    180deg,
    rgba(var(--bg-30-rgb), 1) 0%,
    rgba(var(--bg-40-rgb), 1) 40%,
    rgba(var(--bg-35-rgb), 1) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.035),
    inset 0 18px 60px rgba(var(--bg-0-rgb), 0.18);
}

.dv-footer {
  height: 34px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background:
    linear-gradient(
      180deg,
      rgba(var(--accent-4-rgb), 0.3) 0%,
      rgba(var(--accent-2-rgb), 0.18) 100%
    ),
    linear-gradient(180deg, rgba(var(--bg-25-rgb), 1) 0%, rgba(var(--bg-20-rgb), 1) 100%);
  border-top: 1px solid rgba(var(--txt-1-rgb), 0.06);
  backdrop-filter: blur(10px);
}

.dv-footer-items {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  font-weight: 900;
  color: rgba(var(--txt-1-rgb), 0.85);
}

.dv-footer-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dv-footer-icon {
  color: rgba(var(--txt-1-rgb), 0.95);
}

.dv-footer-value {
  letter-spacing: 0.2px;
}

.dv-footer-sep {
  width: 1px;
  height: 16px;
  background: rgba(var(--txt-1-rgb), 0.25);
  opacity: 0.7;
}
</style>

<style>
/* MENU */
.dv-menu.q-menu {
  min-width: 220px;
  border-radius: 16px;

  background:
    radial-gradient(600px 220px at 20% 0%, rgba(var(--accent-1-rgb), 0.14), transparent 55%),
    linear-gradient(180deg, rgba(var(--bg-25-rgb), 0.92), rgba(var(--bg-15-rgb), 0.92));

  border: 1px solid rgba(var(--txt-1-rgb), 0.1);

  box-shadow:
    0 18px 60px rgba(var(--bg-0-rgb), 0.55),
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04);

  backdrop-filter: blur(14px);
  overflow: hidden;
}

.dv-menu-inner {
  padding: 10px;
}

.dv-menu-head {
  padding: 10px 10px 8px 10px;
  border-radius: 12px;
  background: rgba(var(--txt-1-rgb), 0.03);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  margin-bottom: 10px;
}

.dv-menu-title {
  font-weight: 950;
  font-size: 12px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(var(--txt-1-rgb), 0.82);
}

.dv-menu-sub {
  margin-top: 2px;
  font-weight: 800;
  font-size: 12px;
  color: rgba(var(--accent-1-rgb), 0.92);
}

.dv-menu-list {
  display: grid;
  gap: 6px;
}

.dv-menu-item.q-btn {
  justify-content: flex-start;
  border-radius: 12px;
  padding: 10px 10px;
  text-transform: none;

  color: rgba(var(--txt-1-rgb), 0.86);
  background: rgba(var(--txt-1-rgb), 0.02);
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
}

.dv-menu-item.q-btn .q-icon {
  opacity: 0.95;
}
.dv-menu-item.q-btn .q-btn__content {
  gap: 10px;
  justify-content: flex-start;
}

.dv-menu-item.q-btn:hover {
  background: linear-gradient(90deg, rgba(var(--accent-1-rgb), 0.16), rgba(var(--txt-1-rgb), 0.03));
  border-color: rgba(var(--accent-1-rgb), 0.22);
}

.dv-menu-item.q-btn:focus-visible {
  outline: 2px solid rgba(var(--accent-1-rgb), 0.38);
  outline-offset: 2px;
}
</style>
