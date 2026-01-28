import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | undefined;

ipcMain.on('dv:win:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
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

void app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});
