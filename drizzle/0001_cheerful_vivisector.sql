CREATE TABLE `pactlineRunSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceKey` varchar(128) NOT NULL,
	`runKey` varchar(64) NOT NULL,
	`snapshot` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pactlineRunSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `pactlineRunSnapshots_runKey_unique` UNIQUE(`runKey`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_workspace_external_id_unique` UNIQUE(`workspaceId`,`externalId`);--> statement-breakpoint
ALTER TABLE `workspaceMembers` ADD CONSTRAINT `workspaceMembers_workspace_user_unique` UNIQUE(`workspaceId`,`userId`);--> statement-breakpoint
CREATE INDEX `invoices_workspace_status_idx` ON `invoices` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `workspaceMembers_workspace_role_idx` ON `workspaceMembers` (`workspaceId`,`role`);