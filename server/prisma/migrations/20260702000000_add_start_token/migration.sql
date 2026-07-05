-- AlterTable
ALTER TABLE `User` ADD COLUMN `requiresStartToken` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Application` ADD COLUMN `requiresStartToken` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `startToken` VARCHAR(191) NULL,
    ADD COLUMN `startTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `startTokenAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `tokenValidatedAt` DATETIME(3) NULL;
