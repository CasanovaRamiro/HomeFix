/*
  Warnings:

  - The primary key for the `application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `clientreview` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `jobapplication` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `post` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `postcategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `postimage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `usercategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `workerreview` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `national_id_type_id` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address_id` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `application` DROP FOREIGN KEY `Application_postId_fkey`;

-- DropForeignKey
ALTER TABLE `application` DROP FOREIGN KEY `Application_workerId_fkey`;

-- DropForeignKey
ALTER TABLE `clientreview` DROP FOREIGN KEY `ClientReview_applicationId_fkey`;

-- DropForeignKey
ALTER TABLE `clientreview` DROP FOREIGN KEY `ClientReview_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `clientreview` DROP FOREIGN KEY `ClientReview_reviewerId_fkey`;

-- DropForeignKey
ALTER TABLE `jobapplication` DROP FOREIGN KEY `JobApplication_postId_fkey`;

-- DropForeignKey
ALTER TABLE `jobapplication` DROP FOREIGN KEY `JobApplication_workerId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_userId_fkey`;

-- DropForeignKey
ALTER TABLE `postcategory` DROP FOREIGN KEY `PostCategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `postcategory` DROP FOREIGN KEY `PostCategory_postId_fkey`;

-- DropForeignKey
ALTER TABLE `postimage` DROP FOREIGN KEY `PostImage_postId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_national_id_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `usercategory` DROP FOREIGN KEY `UserCategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `usercategory` DROP FOREIGN KEY `UserCategory_userId_fkey`;

-- DropForeignKey
ALTER TABLE `workerreview` DROP FOREIGN KEY `WorkerReview_applicationId_fkey`;

-- DropForeignKey
ALTER TABLE `workerreview` DROP FOREIGN KEY `WorkerReview_reviewerId_fkey`;

-- DropForeignKey
ALTER TABLE `workerreview` DROP FOREIGN KEY `WorkerReview_workerId_fkey`;

-- AlterTable
ALTER TABLE `application` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `workerId` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `category` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `clientreview` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `applicationId` VARCHAR(191) NOT NULL,
    MODIFY `reviewerId` VARCHAR(191) NOT NULL,
    MODIFY `clientId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `jobapplication` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `workerId` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `post` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `postcategory` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `postimage` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `postId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'client',
    ALTER COLUMN `nationalId` DROP DEFAULT,
    ALTER COLUMN `surname` DROP DEFAULT,
    MODIFY `national_id_type_id` VARCHAR(191) NOT NULL,
    MODIFY `address_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `usercategory` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `workerreview` DROP PRIMARY KEY,
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
