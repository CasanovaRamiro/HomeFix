-- AlterTable
ALTER TABLE `Post`
    ADD COLUMN `isBidding` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bidWeights` TEXT NULL,
    ADD COLUMN `materialResponsibility` VARCHAR(191) NULL DEFAULT 'to_agree',
    ADD COLUMN `budgetMax` DOUBLE NULL;
