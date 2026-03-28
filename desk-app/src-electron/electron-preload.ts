/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

import { contextBridge, ipcRenderer } from 'electron';

import type { ExerciseSettingsState } from '#src/shared/settings/exercise';
import type { NotificationSettingsState } from '#src/shared/settings/notification';
import type { Accent, ThemeMode, ThemeState } from '#src/shared/settings/theme';

contextBridge.exposeInMainWorld('electronDeskVitalsAPI', {
  minimize: () => ipcRenderer.send('dv:win:minimize'),
  minimizeFor: (seconds: number) =>
    ipcRenderer.invoke('dv:win:minimizeFor', seconds) as Promise<boolean>,
  toggleMaximize: () => ipcRenderer.invoke('dv:win:toggleMaximize') as Promise<boolean>,
  isMaximized: () => ipcRenderer.invoke('dv:win:isMaximized') as Promise<boolean>,
  close: () => ipcRenderer.send('dv:win:close'),
  openExerciseWindow: (payload?: { route?: string; focus?: boolean }) =>
    ipcRenderer.invoke('dv:win:openExercise', payload ?? {}) as Promise<boolean>,
  getThemeState: () => ipcRenderer.invoke('dv:theme:getState') as Promise<ThemeState>,
  setThemeMode: (mode: ThemeMode) => ipcRenderer.invoke('dv:theme:setMode', mode) as Promise<ThemeState>,
  setThemeAccent: (accent: Accent) =>
    ipcRenderer.invoke('dv:theme:setAccent', accent) as Promise<ThemeState>,
  onThemeChanged: (listener: (state: ThemeState) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, state: ThemeState) => listener(state);
    ipcRenderer.on('dv:theme:changed', wrapped);
    return () => ipcRenderer.removeListener('dv:theme:changed', wrapped);
  },
  getExerciseSettingsState: () =>
    ipcRenderer.invoke('dv:exercise:getState') as Promise<ExerciseSettingsState>,
  setBreakEveryMin: (value: number) =>
    ipcRenderer.invoke('dv:exercise:setBreakEveryMin', value) as Promise<ExerciseSettingsState>,
  setExercisesPerBreak: (value: number) =>
    ipcRenderer.invoke('dv:exercise:setExercisesPerBreak', value) as Promise<ExerciseSettingsState>,
  onExerciseSettingsChanged: (listener: (state: ExerciseSettingsState) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, state: ExerciseSettingsState) => listener(state);
    ipcRenderer.on('dv:exercise:changed', wrapped);
    return () => ipcRenderer.removeListener('dv:exercise:changed', wrapped);
  },
  getNotificationSettingsState: () =>
    ipcRenderer.invoke('dv:notification:getState') as Promise<NotificationSettingsState>,
  setNotificationsEnabled: (value: boolean) =>
    ipcRenderer.invoke(
      'dv:notification:setNotificationsEnabled',
      value,
    ) as Promise<NotificationSettingsState>,
  onNotificationSettingsChanged: (listener: (state: NotificationSettingsState) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, state: NotificationSettingsState) =>
      listener(state);
    ipcRenderer.on('dv:notification:changed', wrapped);
    return () => ipcRenderer.removeListener('dv:notification:changed', wrapped);
  },
});
