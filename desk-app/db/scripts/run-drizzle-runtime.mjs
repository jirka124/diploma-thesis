import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  findProjectRoot,
  loadDeskVitalsEnv,
  resolveAppDataRoot,
  resolveDbPathFromSuffix,
} from '../../tools/runtime-paths.mjs';

const projectRoot = findProjectRoot();
loadDeskVitalsEnv(projectRoot);

function resolveRuntimeDbPath() {
  const suffix = process.env.DESKVITALS_DB_PATH?.trim();
  return resolveDbPathFromSuffix(resolveAppDataRoot(), suffix);
}

const action = process.argv[2] || 'studio';
const allowed = new Set(['studio', 'migrate', 'check', 'push', 'pull', 'generate']);

if (!allowed.has(action)) {
  console.error(
    `Unsupported action: ${action}. Use "studio", "migrate", "check", "push", "pull", or "generate".`,
  );
  process.exit(1);
}

const dbPath = resolveRuntimeDbPath();
console.info(`[drizzle-runtime] DB_PATH=${dbPath}`);

const require = createRequire(import.meta.url);
const electronBinary = require('electron');
const childEnv = {
  ...process.env,
  ELECTRON_RUN_AS_NODE: '1',
  DESKVITALS_DB_PATH: process.env.DESKVITALS_DB_PATH,
};

function runWithElectron(args) {
  const result = spawnSync(electronBinary, args, {
    stdio: 'inherit',
    env: childEnv,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  return result.status ?? 1;
}

const drizzleBin = path.join(projectRoot, 'node_modules', 'drizzle-kit', 'bin.cjs');
const args = [drizzleBin, action, '--config=drizzle.config.ts'];
process.exit(runWithElectron(args));
