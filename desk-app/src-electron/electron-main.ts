import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

import {
  coerceBreakEveryMin,
  coerceExercisesPerBreak,
} from '#src/shared/settings/exercise';
import {
  coerceNotificationsEnabled,
} from '#src/shared/settings/notification';
import { isAccent, isThemeMode } from '#src/shared/settings/theme';
import { ExerciseSettingsRuntime } from '#electron/runtime/settings/exercise';
import { NotificationSettingsRuntime } from '#electron/runtime/settings/notification';
import { RuntimeConfigStore } from '#electron/runtime/runtime-config-store';
import { RuntimeStateStore } from '#electron/runtime/runtime-state-store';
import { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';
import { loadRuntimeEnv } from '#electron/runtime/runtime-env';
import { StreakRuntime } from '#electron/runtime/state/streak';
import { StatisticsRuntime } from '#electron/runtime/state/statistics';
import { BreakRuntime } from '#electron/runtime/state/break-runtime';
import { BreakCycleRuntime } from '#electron/runtime/state/break-cycle';
import { BreakRewardRuntime } from '#electron/runtime/state/break-reward';
import { BreakSessionRuntime } from '#electron/runtime/state/break-session';
import { ThemeRuntime } from '#electron/runtime/settings/theme';
import { coerceBreakTakenInput, coerceStatisticsDateRange } from '#src/shared/state/statistics';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();
loadRuntimeEnv();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | undefined;
let exerciseWindows: BrowserWindow[] = [];
const minimizeForTimers = new Map<number, NodeJS.Timeout>();
const runtimeEventBus = new RuntimeEventBus();
const runtimeConfigStore = new RuntimeConfigStore();
const themeRuntime = new ThemeRuntime(runtimeConfigStore);
const exerciseSettingsRuntime = new ExerciseSettingsRuntime(runtimeConfigStore, runtimeEventBus);
const notificationSettingsRuntime = new NotificationSettingsRuntime(runtimeConfigStore);
const runtimeStateStore = new RuntimeStateStore();
const streakRuntime = new StreakRuntime(runtimeStateStore);
const statisticsRuntime = new StatisticsRuntime(runtimeStateStore);
const breakSessionRuntime = new BreakSessionRuntime(exerciseSettingsRuntime, runtimeEventBus);
const breakCycleRuntime = new BreakCycleRuntime(exerciseSettingsRuntime, runtimeEventBus);
const breakRewardRuntime = new BreakRewardRuntime(runtimeStateStore);
const breakRuntime = new BreakRuntime(
  breakCycleRuntime,
  breakSessionRuntime,
  breakRewardRuntime,
  statisticsRuntime,
  streakRuntime,
  exerciseSettingsRuntime,
  runtimeEventBus,
);
let removeBreakSessionStartedListener: (() => void) | null = null;
let removeBreakSessionCanceledListener: (() => void) | null = null;
let removeBreakSessionFinishedListener: (() => void) | null = null;

ipcMain.on('dv:win:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
});

ipcMain.handle('dv:win:minimizeFor', async (event, seconds: number) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  const winId = win.id;

  const s = Math.max(1, Math.min(60, Math.floor(seconds || 10)));

  const existingTimer = minimizeForTimers.get(winId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    minimizeForTimers.delete(winId);
  }

  win.minimize();

  let minRes: (state: boolean) => void, minRej: () => void;
  const minEndPromise = new Promise((res, rej) => {
    minRes = res;
    minRej = rej;
  });

  const nextTimer = setTimeout(() => {
    if (!win.isDestroyed()) {
      win.restore();
      win.show();
      win.focus();
    }
    minimizeForTimers.delete(winId);

    if (!win.isDestroyed()) return minRes(true);
    return minRej();
  }, s * 1000);
  minimizeForTimers.set(winId, nextTimer);

  return minEndPromise;
});

ipcMain.handle('dv:win:toggleMaximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;

  if (win.isMaximized()) win.unmaximize();
  else win.maximize();

  return win.isMaximized();
});

ipcMain.handle('dv:win:isMaximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win?.isMaximized() ?? false;
});

ipcMain.on('dv:win:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.close();
});

ipcMain.handle('dv:theme:getState', () => {
  return themeRuntime.getState();
});

ipcMain.handle('dv:theme:setMode', (_event, mode: unknown) => {
  if (!isThemeMode(mode)) return themeRuntime.getState();
  return themeRuntime.setMode(mode);
});

ipcMain.handle('dv:theme:setAccent', (_event, accent: unknown) => {
  if (!isAccent(accent)) return themeRuntime.getState();
  return themeRuntime.setAccent(accent);
});

ipcMain.handle('dv:exercise:getState', () => {
  return exerciseSettingsRuntime.getState();
});

ipcMain.handle('dv:exercise:setBreakEveryMin', (_event, value: unknown) => {
  return exerciseSettingsRuntime.setBreakEveryMin(coerceBreakEveryMin(value));
});

ipcMain.handle('dv:exercise:setExercisesPerBreak', (_event, value: unknown) => {
  return exerciseSettingsRuntime.setExercisesPerBreak(coerceExercisesPerBreak(value));
});

ipcMain.handle('dv:notification:getState', () => {
  return notificationSettingsRuntime.getState();
});

ipcMain.handle('dv:notification:setNotificationsEnabled', (_event, value: unknown) => {
  return notificationSettingsRuntime.setNotificationsEnabled(coerceNotificationsEnabled(value));
});

ipcMain.handle('dv:streak:getState', () => {
  return streakRuntime.getState();
});

ipcMain.handle('dv:statistics:getState', (_event, range: unknown) => {
  return statisticsRuntime.getState(coerceStatisticsDateRange(range));
});

ipcMain.handle('dv:statistics:addBreak', (_event, payload: unknown) => {
  return statisticsRuntime.addBreak(coerceBreakTakenInput(payload));
});

ipcMain.handle('dv:break:getState', () => {
  return breakRuntime.getState();
});

ipcMain.handle('dv:break:canPostpone', () => {
  return breakRuntime.canPostponeBreak();
});

ipcMain.handle('dv:break:postpone', (_event, minutes: unknown) => {
  const parsed = Number(minutes);
  const safeMinutes = Number.isFinite(parsed) ? parsed : 5;
  return breakRuntime.postponeByMinutes(safeMinutes);
});

ipcMain.handle('dv:breakSession:getState', () => {
  return breakRuntime.getSessionState();
});

ipcMain.handle('dv:breakSession:start', () => {
  return breakRuntime.startSession();
});

ipcMain.handle('dv:breakSession:pause', () => {
  return breakRuntime.pauseSession();
});

ipcMain.handle('dv:breakSession:resume', () => {
  return breakRuntime.resumeSession();
});

ipcMain.handle('dv:breakSession:skipExercise', () => {
  return breakRuntime.skipSessionExercise();
});

ipcMain.handle('dv:breakSession:cancel', () => {
  return breakRuntime.cancelSession();
});

ipcMain.handle(
  'dv:win:openExercise',
  async (_event, payload?: { route?: string; focus?: boolean }) => {
    await openExerciseWindow(payload);
    return true;
  },
);

async function openExerciseWindow(payload?: { route?: string; focus?: boolean }) {
  const route = payload?.route ?? '/exercise';
  const focus = payload?.focus ?? true;
  const targetWindowCount = 2;

  exerciseWindows = exerciseWindows.filter((win) => !win.isDestroyed());
  while (exerciseWindows.length < targetWindowCount) {
    exerciseWindows.push(createExerciseWindow());
  }

  for (const win of exerciseWindows) {
    try {
      await loadRoute(win, route);
    } catch (e) {
      console.error(e);
    }
  }

  if (focus) {
    for (const win of exerciseWindows) {
      if (win.isDestroyed()) continue;
      if (win.isMinimized()) win.restore();
      win.show();
    }
    const firstWindow = exerciseWindows[0];
    if (firstWindow && !firstWindow.isDestroyed()) {
      firstWindow.focus();
    }
  }
}

function closeAllExerciseWindows() {
  for (const win of exerciseWindows) {
    if (!win.isDestroyed()) {
      win.close();
    }
  }
  exerciseWindows = [];
}

function getAppUrlForRoute(route: string) {
  // route např. "/exercise"
  if (process.env.DEV) {
    const base = process.env.APP_URL;
    return `${base}#${route.startsWith('/') ? route : `/${route}`}`;
  }
  return `file://index.html#${route.startsWith('/') ? route : `/${route}`}`;
}

async function loadRoute(win: BrowserWindow, route: string) {
  if (process.env.DEV) {
    await win.loadURL(getAppUrlForRoute(route).replace('file://index.html', process.env.APP_URL));
  } else {
    await win.loadFile('index.html', { hash: route.startsWith('/') ? route.slice(1) : route });
  }
}

function createExerciseWindow() {
  const win = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'),
    width: 900,
    height: 550,
    minWidth: 900,
    minHeight: 550,
    resizable: true,

    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b0c10',
    useContentSize: true,

    alwaysOnTop: !process.env.DEV,

    modal: false,
    show: false,

    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  });

  win.once('ready-to-show', () => win.show());

  win.on('closed', () => {
    exerciseWindows = exerciseWindows.filter((candidate) => candidate !== win);
  });

  return win;
}

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 900,
    height: 550,
    minWidth: 900,
    minHeight: 550,
    resizable: true,

    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b0c10',

    useContentSize: true,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  });

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadFile('index.html');
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(async () => {
  runtimeConfigStore.load();
  removeBreakSessionStartedListener = runtimeEventBus.on('break-session:started', () => {
    void openExerciseWindow({ route: '/exercise', focus: true });
  });
  removeBreakSessionCanceledListener = runtimeEventBus.on('break-session:canceled', () => {
    closeAllExerciseWindows();
  });
  removeBreakSessionFinishedListener = runtimeEventBus.on('break-session:finished', () => {
    closeAllExerciseWindows();
  });
  try {
    runtimeStateStore.init();
    if (process.env.DEV) {
      const smoke = await runtimeStateStore.runConnectionSmokeTest();
      console.info('[runtime-state] smoke test:', smoke);
    }
  } catch (error) {
    console.error('Runtime state initialization failed:', error);
    app.exit(1);
    return;
  }
  breakRuntime.init();
  return createWindow();
});

app.on('window-all-closed', () => {
  for (const timer of minimizeForTimers.values()) {
    clearTimeout(timer);
  }
  minimizeForTimers.clear();
  if (removeBreakSessionStartedListener !== null) {
    removeBreakSessionStartedListener();
    removeBreakSessionStartedListener = null;
  }
  if (removeBreakSessionCanceledListener !== null) {
    removeBreakSessionCanceledListener();
    removeBreakSessionCanceledListener = null;
  }
  if (removeBreakSessionFinishedListener !== null) {
    removeBreakSessionFinishedListener();
    removeBreakSessionFinishedListener = null;
  }
  breakRuntime.destroy();
  breakSessionRuntime.destroy();
  runtimeStateStore.close();
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});
