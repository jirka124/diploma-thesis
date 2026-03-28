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
import { loadRuntimeEnv } from '#electron/runtime/runtime-env';
import { ThemeRuntime } from '#electron/runtime/settings/theme';
import { RuntimeStateStore } from '#electron/runtime/state/runtime-state-store';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();
loadRuntimeEnv();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | undefined;
let exerciseWindow: BrowserWindow | undefined;
let minimizeForTimer: NodeJS.Timeout | undefined;
const runtimeConfigStore = new RuntimeConfigStore();
const themeRuntime = new ThemeRuntime(runtimeConfigStore);
const exerciseSettingsRuntime = new ExerciseSettingsRuntime(runtimeConfigStore);
const notificationSettingsRuntime = new NotificationSettingsRuntime(runtimeConfigStore);
const runtimeStateStore = new RuntimeStateStore();

ipcMain.on('dv:win:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
});

ipcMain.handle('dv:win:minimizeFor', async (event, seconds: number) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;

  const s = Math.max(1, Math.min(60, Math.floor(seconds || 10)));

  if (minimizeForTimer) {
    clearTimeout(minimizeForTimer);
    minimizeForTimer = undefined;
  }

  win.minimize();

  let minRes: (state: boolean) => void, minRej: () => void;
  const minEndPromise = new Promise((res, rej) => {
    minRes = res;
    minRej = rej;
  });

  minimizeForTimer = setTimeout(() => {
    if (!win.isDestroyed()) {
      win.restore();
      win.show();
      win.focus();
    }
    minimizeForTimer = undefined;

    if (!win.isDestroyed()) return minRes(true);
    return minRej();
  }, s * 1000);

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

ipcMain.handle(
  'dv:win:openExercise',
  async (_event, payload?: { route?: string; focus?: boolean }) => {
    const route = payload?.route ?? '/exercise';
    const focus = payload?.focus ?? true;

    if (!exerciseWindow || exerciseWindow.isDestroyed()) {
      exerciseWindow = createExerciseWindow();
      await loadRoute(exerciseWindow, route);
    } else {
      try {
        await loadRoute(exerciseWindow, route);
      } catch (e) {
        console.error(e);
      }
    }

    if (focus) {
      if (exerciseWindow.isMinimized()) exerciseWindow.restore();
      exerciseWindow.show();
      exerciseWindow.focus();
    }

    return true;
  },
);

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
    if (exerciseWindow === win) exerciseWindow = undefined;
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
  try {
    runtimeStateStore.init();
    if (process.env.DEV) {
      const smoke = await runtimeStateStore.runConnectionSmokeTest();
      console.info('[runtime-state] smoke test:', smoke);
    }
  } catch (error) {
    console.error('Runtime state initialization failed:', error);
  }
  return createWindow();
});

app.on('window-all-closed', () => {
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
