import {
  findProjectRoot,
  loadDeskVitalsEnv,
  resolveAppDataRoot,
  resolveDbPathFromSuffix,
  resolveMigrationsDir,
} from '#tools/runtime-paths.mjs';

export function loadRuntimeEnv() {
  loadDeskVitalsEnv(findProjectRoot());
}

export function resolveRuntimeDbPath() {
  loadRuntimeEnv();

  return resolveDbPathFromSuffix(resolveAppDataRoot(), process.env.DESKVITALS_DB_PATH);
}

export function resolveRuntimeMigrationsDir() {
  loadRuntimeEnv();
  return resolveMigrationsDir(findProjectRoot(), process.env.DESKVITALS_DB_MIGRATIONS_DIR);
}
