import type BetterSqlite3 from 'better-sqlite3';

type SqliteConnection = ReturnType<typeof BetterSqlite3>;

type ExerciseSeed = {
  id: string;
  categoryId: string;
  name: string;
  durationSec: number;
  instructions: string[];
  sortOrder: number;
};

const categories = [
  { id: 'eyes', name: 'Eyes', sortOrder: 1 },
  { id: 'neck-shoulders', name: 'Neck & shoulders', sortOrder: 2 },
  { id: 'hands-wrists', name: 'Hands & wrists', sortOrder: 3 },
  { id: 'lower-body', name: 'Lower body', sortOrder: 4 },
] as const;

const exercises: ExerciseSeed[] = [
  { id: 'eye-focus', categoryId: 'eyes', name: 'Eye Focus', durationSec: 30, sortOrder: 1, instructions: ['Look at an object far away.', 'Blink slowly a few times.', 'Relax your face and jaw.'] },
  { id: 'palming', categoryId: 'eyes', name: 'Palming', durationSec: 30, sortOrder: 2, instructions: ['Warm your hands by rubbing them together.', 'Cup your palms over closed eyes without pressure.', 'Breathe slowly and relax.'] },
  { id: 'neck-side-tilt', categoryId: 'neck-shoulders', name: 'Neck Side Tilt', durationSec: 35, sortOrder: 1, instructions: ['Sit tall with shoulders down.', 'Gently tilt your head toward one shoulder.', 'Hold comfortably, then switch sides.'] },
  { id: 'shoulder-rolls', categoryId: 'neck-shoulders', name: 'Shoulder Rolls', durationSec: 30, sortOrder: 2, instructions: ['Relax your arms by your sides.', 'Roll shoulders up, back, and down.', 'Move slowly and keep breathing.'] },
  { id: 'chest-opener', categoryId: 'neck-shoulders', name: 'Chest Opener', durationSec: 35, sortOrder: 3, instructions: ['Interlace your fingers behind your back.', 'Gently draw your shoulders back.', 'Lift your chest without straining.'] },
  { id: 'wrist-stretch', categoryId: 'hands-wrists', name: 'Wrist Stretch', durationSec: 40, sortOrder: 1, instructions: ['Extend one arm forward, palm up.', 'Gently pull the fingers down with the other hand.', 'Hold, then switch sides.'] },
  { id: 'finger-fan', categoryId: 'hands-wrists', name: 'Finger Fan', durationSec: 25, sortOrder: 2, instructions: ['Spread your fingers as wide as comfortable.', 'Hold briefly, then make a loose fist.', 'Repeat slowly.'] },
  { id: 'forearm-rotation', categoryId: 'hands-wrists', name: 'Forearm Rotation', durationSec: 30, sortOrder: 3, instructions: ['Keep elbows close to your body.', 'Turn palms up, then down.', 'Move through a comfortable range.'] },
  { id: 'seated-leg-extension', categoryId: 'lower-body', name: 'Seated Leg Extension', durationSec: 35, sortOrder: 1, instructions: ['Sit tall with both feet on the floor.', 'Extend one leg slowly.', 'Lower it with control, then switch sides.'] },
  { id: 'ankle-circles', categoryId: 'lower-body', name: 'Ankle Circles', durationSec: 30, sortOrder: 2, instructions: ['Lift one foot slightly off the floor.', 'Draw slow circles with the ankle.', 'Reverse direction, then switch sides.'] },
  { id: 'seated-twist', categoryId: 'lower-body', name: 'Seated Twist', durationSec: 35, sortOrder: 3, instructions: ['Sit upright with feet grounded.', 'Rotate gently to one side.', 'Return to centre, then repeat on the other side.'] },
];

export function seedExerciseCatalog(sqlite: SqliteConnection) {
  const insertCategory = sqlite.prepare(`
    INSERT INTO exercise_categories (id, name, sort_order)
    VALUES (@id, @name, @sortOrder)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order
  `);
  const insertExercise = sqlite.prepare(`
    INSERT INTO exercises (id, category_id, name, duration_sec, instructions_json, image_key, sort_order)
    VALUES (@id, @categoryId, @name, @durationSec, @instructionsJson, @imageKey, @sortOrder)
    ON CONFLICT(id) DO UPDATE SET
      category_id = excluded.category_id,
      name = excluded.name,
      duration_sec = excluded.duration_sec,
      instructions_json = excluded.instructions_json,
      image_key = excluded.image_key,
      sort_order = excluded.sort_order
  `);

  sqlite.transaction(() => {
    for (const category of categories) insertCategory.run(category);
    for (const exercise of exercises) {
      insertExercise.run({
        ...exercise,
        instructionsJson: JSON.stringify(exercise.instructions),
        imageKey: 'demo-avatar-default',
      });
    }
  })();
}
