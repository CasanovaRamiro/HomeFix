-- DropForeignKey
ALTER TABLE `Report` DROP FOREIGN KEY `Report_applicationId_fkey`;

-- DropIndex
ALTER TABLE `Report` DROP INDEX `Report_applicationId_key`;
ALTER TABLE `Report` DROP INDEX `Report_reviewId_key`;

-- CreateIndex
CREATE UNIQUE INDEX `Report_applicationId_reporterId_key` ON `Report`(`applicationId`, `reporterId`);
CREATE UNIQUE INDEX `Report_reviewId_reporterId_key` ON `Report`(`reviewId`, `reporterId`);

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
