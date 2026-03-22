import { computed, ref } from 'vue';
import { colors, setCssVar } from 'quasar';
import {
  THEME_ACCENTS,
  THEME_DEFAULT_STATE,
} from 'src/shared/settings/theme';
import type { Accent, ThemeMode, ThemeState } from 'src/shared/settings/theme';
export type { Accent, ThemeMode, ThemeState } from 'src/shared/settings/theme';

const { lighten, textToRgb } = colors;

export type ThemePreview = {
  timeout: ReturnType<typeof setTimeout>;
  timestamp: Date;
  accent: Accent;
} | null;

const ACCENTS: Record<Accent, { a1: string; a2: string; a3: string; a4: string; a5: string }> = {
  pink: {
    a1: '233, 30, 99',
    a2: '238, 74, 116',
    a3: '235, 103, 128',
    a4: '249, 125, 144',
    a5: '201, 77, 255',
  },
  blue: {
    a1: '79, 141, 255',
    a2: '116, 168, 255',
    a3: '150, 190, 255',
    a4: '134, 173, 233',
    a5: '77, 224, 255',
  },
  green: {
    a1: '66, 214, 122',
    a2: '122, 240, 160',
    a3: '150, 255, 190',
    a4: '133, 238, 175',
    a5: '47, 214, 255',
  },
  amber: {
    a1: '255, 176, 32',
    a2: '255, 211, 122',
    a3: '255, 228, 170',
    a4: '246, 216, 150',
    a5: '255, 79, 124',
  },
};

const MODES: Record<ThemeMode, { bg: Record<string, string>; txt: Record<string, string> }> = {
  dark: {
    bg: {
      '0': '0, 0, 0',
      '15': '15, 15, 15',
      '20': '20, 20, 20',
      '25': '25, 25, 25',
      '30': '30, 30, 30',
      '35': '35, 35, 35',
      '40': '40, 40, 40',
      '50': '50, 50, 50',
    },
    txt: {
      '1': '255, 255, 255',
      '2': '200, 200, 200',
      '3': '175, 175, 175',
    },
  },
  light: {
    bg: {
      '0': '255, 255, 255',
      '15': '240, 240, 240',
      '20': '235, 235, 235',
      '25': '230, 230, 230',
      '30': '225, 225, 225',
      '35': '220, 220, 220',
      '40': '215, 215, 215',
      '50': '205, 205, 205',
    },
    txt: {
      '1': '0, 0, 0',
      '2': '50, 50, 50',
      '3': '80, 80, 80',
    },
  },
};

function setCssVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function lightenRGB(rgb: string, perc: number) {
  const obj = textToRgb(lighten(`rgb(${rgb})`, perc));
  return `${obj.r}, ${obj.g}, ${obj.b}`;
}

export function getAccentStops(accent: Accent, mode: ThemeMode) {
  const c = ACCENTS[accent];
  const fix = (v: string) => (mode === 'light' ? lightenRGB(v, -20) : v);
  return {
    a1: fix(c.a1),
    a2: fix(c.a2),
    a3: fix(c.a3),
    a4: fix(c.a4),
    a5: fix(c.a5),
  };
}

export function applyMode(mode: ThemeMode, accent: Accent) {
  const def = MODES[mode];
  const vars: Record<string, string> = {};

  for (const [k, v] of Object.entries(def.bg)) vars[`--bg-${k}-rgb`] = v;
  for (const [k, v] of Object.entries(def.txt)) vars[`--txt-${k}-rgb`] = v;

  setCssVars(vars);
  applyAccent(accent, mode);
}

export function applyAccent(accent: Accent, mode: ThemeMode) {
  const c = getAccentStops(accent, mode);

  setCssVars({
    '--accent-1-rgb': c.a1,
    '--accent-2-rgb': c.a2,
    '--accent-3-rgb': c.a3,
    '--accent-4-rgb': c.a4,
    '--accent-5-rgb': c.a5,
  });

  setCssVar('primary', `rgb(${c.a1})`);
  setCssVar('secondary', `rgb(${c.a2})`);
  setCssVar('accent', `rgb(${c.a5})`);
}

export const ACCENT_ORDER: Accent[] = [...THEME_ACCENTS];
export const ACCENT_LABEL: Record<Accent, string> = {
  pink: 'Pink',
  blue: 'Blue',
  green: 'Green',
  amber: 'Amber',
};

const mode = ref<ThemeMode>(THEME_DEFAULT_STATE.mode);
const accent = ref<Accent>(THEME_DEFAULT_STATE.accent);
const preview = ref<ThemePreview>(null);

let committedState: ThemeState = { ...THEME_DEFAULT_STATE };
let inited = false;
let removeThemeListener: (() => void) | null = null;

function applyAll() {
  applyMode(mode.value, accent.value);
}

function syncState(state: ThemeState) {
  committedState = { ...state };

  if (preview.value !== null && preview.value.accent !== state.accent) {
    clearTimeout(preview.value.timeout);
    preview.value = null;
  }

  mode.value = state.mode;
  accent.value = state.accent;
  applyAll();
}

function cancelPreviewAccent() {
  if (preview.value !== null) {
    clearTimeout(preview.value.timeout);
    preview.value = null;
  }
}

function resetPreviewAccent() {
  if (preview.value === null) return;

  accent.value = committedState.accent;
  applyAccent(accent.value, mode.value);

  cancelPreviewAccent();
}

export function useThemeSettings() {
  function handleStateUpdate(promise: Promise<ThemeState>) {
    void promise
      .then((state) => {
        syncState(state);
      })
      .catch((err) => console.error('Theme update failed:', err));
  }

  async function initTheme() {
    if (inited) return;
    inited = true;

    if (window.electronDeskVitalsAPI?.getThemeState) {
      const state = await window.electronDeskVitalsAPI.getThemeState();
      syncState(state);

      removeThemeListener = window.electronDeskVitalsAPI.onThemeChanged((next) => {
        syncState(next);
      });

      return;
    }

    syncState(THEME_DEFAULT_STATE);
  }

  function setMode(next: ThemeMode) {
    resetPreviewAccent();

    if (window.electronDeskVitalsAPI?.setThemeMode) {
      mode.value = next;
      applyAll();
      handleStateUpdate(window.electronDeskVitalsAPI.setThemeMode(next));
      return;
    }

    syncState({ ...committedState, mode: next });
  }

  function setAccent(next: Accent) {
    resetPreviewAccent();

    if (window.electronDeskVitalsAPI?.setThemeAccent) {
      accent.value = next;
      applyAccent(accent.value, mode.value);
      handleStateUpdate(window.electronDeskVitalsAPI.setThemeAccent(next));
      return;
    }

    syncState({ ...committedState, accent: next });
  }

  function previewAccent(next: Accent) {
    cancelPreviewAccent();

    accent.value = next;
    applyAccent(accent.value, mode.value);

    const previewEndDate = new Date(Date.now() + 10000);

    preview.value = {
      accent: next,
      timestamp: previewEndDate,
      timeout: setTimeout(resetPreviewAccent, previewEndDate.getTime() - Date.now()),
    };
  }

  const accentStops = computed(() => getAccentStops(accent.value, mode.value));

  return {
    mode,
    accent,
    preview,
    accentStops,

    initTheme,
    setMode,
    setAccent,
    previewAccent,

    destroyThemeSync() {
      if (removeThemeListener !== null) {
        removeThemeListener();
        removeThemeListener = null;
      }
    },
  };
}
