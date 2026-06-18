-- AlterTable
ALTER TABLE `Post` ADD COLUMN `isEmergency` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emergencyExpiresAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `emergenciesEnabled` BOOLEAN NOT NULL DEFAULT false;
