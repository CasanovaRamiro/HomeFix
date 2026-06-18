-- AlterTable
ALTER TABLE `application` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Application_workerId_postId_idx` ON `application`(`workerId`, `postId`);

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `PostCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
