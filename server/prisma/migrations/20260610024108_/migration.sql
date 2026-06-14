/*
  Warnings:

  - The primary key for the `Application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ClientReview` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `JobApplication` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Post` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PostCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PostImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WorkerReview` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `national_id_type_id` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address_id` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
SET FOREIGN_KEY_CHECKS=0;

-- DropForeignKey
ALTER TABLE `Application` DROP FOREIGN KEY IF EXISTS `Application_postId_fkey`;

-- DropForeignKey
ALTER TABLE `Application` DROP FOREIGN KEY IF EXISTS `Application_workerId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientReview` DROP FOREIGN KEY IF EXISTS `ClientReview_applicationId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientReview` DROP FOREIGN KEY IF EXISTS `ClientReview_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientReview` DROP FOREIGN KEY IF EXISTS `ClientReview_reviewerId_fkey`;

-- DropForeignKey
ALTER TABLE `JobApplication` DROP FOREIGN KEY IF EXISTS `JobApplication_postId_fkey`;

-- DropForeignKey
ALTER TABLE `JobApplication` DROP FOREIGN KEY IF EXISTS `JobApplication_workerId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY IF EXISTS `Post_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PostCategory` DROP FOREIGN KEY IF EXISTS `PostCategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `PostCategory` DROP FOREIGN KEY IF EXISTS `PostCategory_postId_fkey`;

-- DropForeignKey
ALTER TABLE `PostImage` DROP FOREIGN KEY IF EXISTS `PostImage_postId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY IF EXISTS `User_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY IF EXISTS `User_national_id_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `UserCategory` DROP FOREIGN KEY IF EXISTS `UserCategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `UserCategory` DROP FOREIGN KEY IF EXISTS `UserCategory_userId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerReview` DROP FOREIGN KEY IF EXISTS `WorkerReview_applicationId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerReview` DROP FOREIGN KEY IF EXISTS `WorkerReview_reviewerId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerReview` DROP FOREIGN KEY IF EXISTS `WorkerReview_workerId_fkey`;

-- AlterTable
ALTER TABLE `Application` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `workerId` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Category` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ClientReview` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `applicationId` VARCHAR(191) NOT NULL,
    MODIFY `reviewerId` VARCHAR(191) NOT NULL,
    MODIFY `clientId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `JobApplication` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `workerId` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Post` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `PostCategory` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `PostImage` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'client',
    ALTER COLUMN `nationalId` DROP DEFAULT,
    ALTER COLUMN `surname` DROP DEFAULT,
    MODIFY `national_id_type_id` VARCHAR(191) NOT NULL,
    MODIFY `address_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `UserCategory` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `WorkerReview` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `applicationId` VARCHAR(191) NOT NULL,
    MODIFY `reviewerId` VARCHAR(191) NOT NULL,
    MODIFY `workerId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_national_id_type_id_fkey` FOREIGN KEY (`national_id_type_id`) REFERENCES `national_id_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `address`(`address_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostCategory` ADD CONSTRAINT `PostCategory_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostCategory` ADD CONSTRAINT `PostCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCategory` ADD CONSTRAINT `UserCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCategory` ADD CONSTRAINT `UserCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobApplication` ADD CONSTRAINT `JobApplication_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobApplication` ADD CONSTRAINT `JobApplication_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostImage` ADD CONSTRAINT `PostImage_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS=1;
