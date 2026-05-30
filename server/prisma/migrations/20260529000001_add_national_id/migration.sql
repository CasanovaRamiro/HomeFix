-- AlterTable: add nationalId column to User
ALTER TABLE `User` ADD COLUMN `nationalId` VARCHAR(191) NOT NULL DEFAULT '';
