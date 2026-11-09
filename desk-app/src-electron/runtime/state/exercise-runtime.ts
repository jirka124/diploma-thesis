import { BrowserWindow } from 'electron';
import { asc, eq } from 'drizzle-orm';

import { exerciseCategoriesTable, exercisesTable } from '#db/schema/runtime-state';
import type { RuntimeEventBus } from '#electron/runtime/event-bus/runtime-event-bus';
import type { RuntimeStateStore } from '#electron/runtime/runtime-state-store';
import type { ExerciseSettingsRuntime } from '#electron/runtime/settings/exercise';
import {
  EXERCISE_RUNTIME_DEFAULT_STATE,
  type ExercisePlanExercise,
  type ExerciseRuntimeState,
} from '#src/shared/state/exercise-runtime';

type CatalogExercise = ExercisePlanExercise;

function cloneExercise(exercise: ExercisePlanExercise): ExercisePlanExercise {
  return { ...exercise, instructions: [...exercise.instructions] };
}

function parseInstructions(value: string, exerciseId: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) return parsed;
  } catch {
    // The catalog is application-owned data. Treat malformed persisted data as a startup error below.
  }
  throw new Error(`Exercise catalog contains invalid instructions for "${exerciseId}".`);
}

export class ExerciseRuntime {
  private initialized = false;
  private catalog: CatalogExercise[] = [];
  private state: ExerciseRuntimeState = { ...EXERCISE_RUNTIME_DEFAULT_STATE };
  private removeExercisesPerBreakChangedListener: (() => void) | null = null;

  constructor(
    private readonly stateStore: RuntimeStateStore,
    private readonly exerciseSettingsRuntime: ExerciseSettingsRuntime,
    private readonly eventBus: RuntimeEventBus,
  ) {}

  init() {
    if (this.initialized) return;
    this.catalog = this.loadCatalog();
    this.assertCatalogCanBuildPlan(this.exerciseSettingsRuntime.getState().exercisesPerBreak);
    this.initialized = true;
    this.regenerateUpcomingPlan();
    this.removeExercisesPerBreakChangedListener = this.eventBus.on(
      'exercise:exercisesPerBreakChanged',
      () => this.regenerateUpcomingPlan(),
    );
  }

  destroy() {
    this.removeExercisesPerBreakChangedListener?.();
    this.removeExercisesPerBreakChangedListener = null;
    this.initialized = false;
  }

  getState(): ExerciseRuntimeState {
    return {
      ...this.state,
      upcomingExercises: this.state.upcomingExercises.map(cloneExercise),
    };
  }

  takeUpcomingPlan(): ExercisePlanExercise[] {
    if (!this.initialized) throw new Error('Exercise runtime must be initialized before starting a break.');

    const plan = this.state.upcomingExercises.map(cloneExercise);
    this.regenerateUpcomingPlan();
    return plan;
  }

  private loadCatalog(): CatalogExercise[] {
    const rows = this.stateStore
      .getDb()
      .select({
        id: exercisesTable.id,
        categoryId: exercisesTable.categoryId,
        categoryName: exerciseCategoriesTable.name,
        title: exercisesTable.name,
        durationSec: exercisesTable.durationSec,
        instructionsJson: exercisesTable.instructionsJson,
        imageKey: exercisesTable.imageKey,
      })
      .from(exercisesTable)
      .innerJoin(exerciseCategoriesTable, eq(exercisesTable.categoryId, exerciseCategoriesTable.id))
      .orderBy(asc(exerciseCategoriesTable.sortOrder), asc(exercisesTable.sortOrder))
      .all();

    return rows.map((row) => ({
      id: row.id,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      title: row.title,
      durationMs: row.durationSec * 1000,
      instructions: parseInstructions(row.instructionsJson, row.id),
      imageKey: row.imageKey,
    }));
  }

  private regenerateUpcomingPlan() {
    const count = this.exerciseSettingsRuntime.getState().exercisesPerBreak;
    this.assertCatalogCanBuildPlan(count);
    this.state = {
      upcomingExercises: this.takeRandomDistinctExercises(count),
      updatedAtIso: new Date().toISOString(),
    };
    this.broadcastState();
  }

  private takeRandomDistinctExercises(count: number): ExercisePlanExercise[] {
    const shuffled = [...this.catalog];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const current = shuffled[index];
      const replacement = shuffled[swapIndex];
      if (!current || !replacement) continue;
      shuffled[index] = replacement;
      shuffled[swapIndex] = current;
    }
    return shuffled.slice(0, count).map(cloneExercise);
  }

  private assertCatalogCanBuildPlan(count: number) {
    if (this.catalog.length < count) {
      throw new Error(
        `Exercise catalog has ${this.catalog.length} exercises but ${count} are required per break.`,
      );
    }
  }

  private broadcastState() {
    const state = this.getState();
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send('dv:exerciseRuntime:changed', state);
    }
  }
}
