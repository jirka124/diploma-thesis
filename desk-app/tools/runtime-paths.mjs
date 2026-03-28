import dotenv from 'dotenv';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let projectRootCache = null;
let loadedEnvFile = null;

export function findProjectRoot(startDir = process.cwd()) {
  if (startDir === process.cwd() && projectRootCache) {
    return projectRootCache;
  }

  let current = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(current, 'package.json'))) {
      if (startDir === process.cwd()) {
        projectRootCache = current;
      }
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      const fallback = path.resolve(startDir);
      if (startDir === process.cwd()) {
        projectRootCache = fallback;
      }
      return fallback;
    }
    current = parent;
  }
}

export function resolveAppDataRoot() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming');
  }

  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support');
  }

  return path.join(os.homedir(), '.config');
}

export function resolveEnvFile() {
  return process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
}

export function loadDeskVitalsEnv(projectRoot) {
  if (loadedEnvFile) return loadedEnvFile;

  const envFile = resolveEnvFile();
  dotenv.config({ path: path.join(projectRoot, envFile), override: true });
  loadedEnvFile = envFile;
  return envFile;
}

export function resolveMigrationsDir(projectRoot, rawDir) {
  const value = (rawDir || '').trim();
  if (!value) return path.resolve(projectRoot, 'db/migrations');

  if (path.isAbsolute(value)) return value;
  return path.resolve(projectRoot, value);
}

export function resolveDefaultDbSuffix() {
  return process.env.NODE_ENV === 'production'
    ? 'DeskVitals/state/runtime-state.sqlite'
    : 'Electron/Runtime/DeskVitals/state/runtime-state.sqlite';
}

export function resolveDbPathFromSuffix(appDataRoot, rawSuffix, defaultSuffix = resolveDefaultDbSuffix()) {
  const suffix = (rawSuffix || '').trim() || defaultSuffix;
  return path.join(appDataRoot, suffix);
}
