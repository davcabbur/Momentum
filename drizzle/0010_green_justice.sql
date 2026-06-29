CREATE TABLE `activity_day` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`steps` integer NOT NULL,
	`source` text NOT NULL
);
