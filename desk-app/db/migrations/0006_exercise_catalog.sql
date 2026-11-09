CREATE TABLE `exercise_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL REFERENCES `exercise_categories`(`id`),
	`name` text NOT NULL,
	`duration_sec` integer NOT NULL,
	`instructions_json` text NOT NULL,
	`image_key` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_category_sort_order_unique_idx` ON `exercises` (`category_id`,`sort_order`);
