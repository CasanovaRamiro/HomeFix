-- AlterTable
ALTER TABLE `post` ADD COLUMN `isEmergency` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emergencyExpiresAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `emergenciesEnabled` BOOLEAN NOT NULL DEFAULT false;
