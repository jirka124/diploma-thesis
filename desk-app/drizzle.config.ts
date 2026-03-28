import { defineConfig } from 'drizzle-kit';

import {
  findProjectRoot,
  loadDeskVitalsEnv,
  resolveAppDataRoot,
  resolveDbPathFromSuffix,
} from '#tools/runtime-paths.mjs';

const projectRoot = findProjectRoot();
loadDeskVitalsEnv(projectRoot);
const dbUrl = resolveDbPathFromSuffix(resolveAppDataRoot(), process.env.DESKVITALS_DB_PATH);
const migrationsOut = (process.env.DESKVITALS_DB_MIGRATIONS_DIR || '').trim() || 'db/migrations';

export default defineConfig({
  schema: './db/schema/*.ts',
  out: migrationsOut,
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
  strict: true,
  verbose: true,
});
