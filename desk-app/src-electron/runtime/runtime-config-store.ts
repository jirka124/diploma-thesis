import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import {
  coerceRuntimeConfig,
  DEFAULT_RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../src/shared/settings/config';

function getConfigDirectory() {
  if (process.env.DEV) {
    return path.join(app.getPath('userData'), 'Runtime', 'DeskVitals', 'config');
  }

  return path.join(app.getPath('userData'), 'config');
}

function getConfigPath() {
  return path.join(getConfigDirectory(), 'config.json');
}

export class RuntimeConfigStore {
  private cache: RuntimeConfig = { ...DEFAULT_RUNTIME_CONFIG };
  private loaded = false;

  load(): RuntimeConfig {
    if (this.loaded) return this.cache;

    try {
      const raw = fs.readFileSync(getConfigPath(), 'utf-8');
      this.cache = coerceRuntimeConfig(JSON.parse(raw));
    } catch {
      this.cache = { ...DEFAULT_RUNTIME_CONFIG };
    }

    this.loaded = true;
    return this.cache;
  }

  get(): RuntimeConfig {
    return this.load();
  }

  patch(next: Partial<RuntimeConfig>): RuntimeConfig {
    const merged = coerceRuntimeConfig({
      ...this.get(),
      ...next,
    });

    this.cache = merged;
    this.persistAsync();

    return this.cache;
  }

  private persistAsync() {
    const payload = JSON.stringify(this.cache, null, 2);

    void fs.promises
      .mkdir(getConfigDirectory(), { recursive: true })
      .then(() => fs.promises.writeFile(getConfigPath(), payload, 'utf-8'))
      .catch((err) => console.error('Runtime config persistence failed:', err));
  }
}
