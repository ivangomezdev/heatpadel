CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`sport` text NOT NULL,
	`points_per_match` integer NOT NULL,
	`court_count` integer NOT NULL,
	`players_json` text NOT NULL,
	`rounds_json` text NOT NULL,
	`results_json` text NOT NULL,
	`standings_json` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	`week_start` text,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tournaments_owner_idx` ON `tournaments` (`owner_id`);--> statement-breakpoint
CREATE INDEX `tournaments_week_idx` ON `tournaments` (`week_start`,`sport`,`status`);