CREATE TABLE `food_product` (
	`barcode` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kcal100` real NOT NULL,
	`protein100` real NOT NULL,
	`carbs100` real NOT NULL,
	`fat100` real NOT NULL
);
