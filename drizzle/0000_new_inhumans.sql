CREATE TABLE `bodyweight_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weight_goal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_kg` real NOT NULL,
	`start_kg` real NOT NULL,
	`start_date` text NOT NULL
);
