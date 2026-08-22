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
