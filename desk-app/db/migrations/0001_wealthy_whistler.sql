CREATE TABLE `streak` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streak_date_unique_idx` ON `streak` (`date`);