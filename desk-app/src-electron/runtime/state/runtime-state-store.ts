import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { testTable } from '#db/schema/runtime-state';
import { resolveRuntimeDbPath, resolveRuntimeMigrationsDir } from '#electron/runtime/runtime-env';
import type { RuntimeStateSmokeTestResult } from './runtime-state.types';

const runtimeSchema = {
  testTable,
};

type SqliteConnection = ReturnType<typeof BetterSqlite3>;

function createRuntimeDb(sqlite: SqliteConnection) {
  return drizzle(sqlite, { schema: runtimeSchema });
}

type RuntimeDb = ReturnType<typeof createRuntimeDb>;

export class RuntimeStateStore {
  private sqlite!: SqliteConnection;
  private hasSqlite = false;
  private db: RuntimeDb | null = null;

  init() {
    const sqlite = this.getSqlite();

    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');

    const migrationsDir = resolveRuntimeMigrationsDir();
    if (!fs.existsSync(migrationsDir)) {
      console.warn('[runtime-state] migrations directory not found:', migrationsDir);
    } else {
      migrate(drizzle(this.getSqlite()), { migrationsFolder: migrationsDir });
    }
  }

  getDbPath() {
    return resolveRuntimeDbPath();
  }

  async runConnectionSmokeTest(): Promise<RuntimeStateSmokeTestResult> {
    const db = this.getDb();
    const updatedAtIso = new Date().toISOString();

    db.insert(testTable)
      .values({ id: 1, label: 'smoke-test', updatedAt: updatedAtIso })
      .onConflictDoUpdate({
        target: testTable.id,
        set: {
          label: 'smoke-test',
          updatedAt: updatedAtIso,
        },
      })
      .run();

    const testRow = await db.query.testTable
      .findFirst({
        where: (table, operators) => operators.eq(table.id, 1),
      })
      .execute();

    const rows = await db.query.testTable.findMany().execute();

    return {
      dbPath: this.getDbPath(),
      selectOneValue: 1,
      testRowExists: Boolean(testRow?.id),
      updatedAtIso,
      rowCount: rows.length,
    };
  }

  private getSqlite() {
    if (this.hasSqlite) return this.sqlite;

    const dbPath = resolveRuntimeDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const sqlite = new BetterSqlite3(dbPath);
    this.sqlite = sqlite;
    this.hasSqlite = true;
    return sqlite;
  }

  private getDb() {
    if (this.db) return this.db;

    const db = createRuntimeDb(this.getSqlite());
    this.db = db;
    return db;
  }

  close() {
    if (this.hasSqlite) {
      this.sqlite.close();
      this.hasSqlite = false;
    }
    this.db = null;
  }
}
