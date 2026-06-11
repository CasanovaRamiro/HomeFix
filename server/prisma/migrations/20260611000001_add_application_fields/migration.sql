-- AlterTable
ALTER TABLE `application`
    ADD COLUMN `message` TEXT NULL,
    ADD COLUMN `availableDays` TEXT NULL,
    ADD COLUMN `availableTimeFrom` VARCHAR(191) NULL,
    ADD COLUMN `availableTimeTo` VARCHAR(191) NULL,
    ADD COLUMN `chargesVisit` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `visitCost` DOUBLE NULL;
