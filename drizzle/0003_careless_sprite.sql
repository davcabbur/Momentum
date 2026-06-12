CREATE TABLE `exercise` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text NOT NULL,
	`pattern` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine_day` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`routine_id` integer NOT NULL,
	`name` text NOT NULL,
	`order_idx` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine_day_exercise` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`routine_day_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`order_idx` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `set_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`set_number` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`reps` integer NOT NULL,
	`rir` integer,
	`set_type` text DEFAULT 'normal' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`routine_day_id` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `user_profile` ADD `level` text;