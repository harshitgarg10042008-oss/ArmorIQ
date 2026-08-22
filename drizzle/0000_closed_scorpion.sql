CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`vendor` varchar(255) NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('received','extracting','validated','completed','rejected','failed') NOT NULL DEFAULT 'received',
	`sourceKey` varchar(512),
	`extractedData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pactlineActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`actionKey` varchar(64) NOT NULL,
	`toolName` varchar(128) NOT NULL,
	`target` varchar(512) NOT NULL,
	`decision` enum('allowed','held','blocked','approved','rejected','executed','failed') NOT NULL,
	`reason` text,
	`argumentsHash` varchar(128),
	`proofReference` varchar(255),
	`executed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pactlineActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pactlineApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`approverUserId` int NOT NULL,
	`decision` enum('approved','rejected') NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pactlineApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pactlineAuditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`runId` int,
	`actorUserId` int,
	`eventType` varchar(128) NOT NULL,
	`payload` json,
	`previousHash` varchar(128),
	`eventHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pactlineAuditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pactlineRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`runKey` varchar(64) NOT NULL,
	`status` enum('running','held','approved','rejected','failed') NOT NULL DEFAULT 'running',
	`planId` varchar(128),
	`planHash` varchar(128),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pactlineRuns_id` PRIMARY KEY(`id`),
	CONSTRAINT `pactlineRuns_runKey_unique` UNIQUE(`runKey`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `workspaceMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('viewer','operator','approver','admin') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
