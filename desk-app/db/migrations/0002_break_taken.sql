CREATE TABLE `break_taken` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trophies_earned` integer NOT NULL,
	`coins_earned` integer NOT NULL,
	`exercise_count` integer NOT NULL,
	`work_time` integer NOT NULL,
	`postpone_time` integer NOT NULL,
	`exercise_time` integer NOT NULL,
	`created_at` text NOT NULL
);
