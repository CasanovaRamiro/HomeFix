/*
  Warnings:

  - The primary key for the `address` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `conversation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `dni_type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `publication` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `publication_category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `request` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `review` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_validation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `validation_level` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `conversation_initiatorId_fkey`;

-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `conversation_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `conversation_requestId_fkey`;

-- DropForeignKey
ALTER TABLE `publication` DROP FOREIGN KEY `publication_userId_fkey`;

-- DropForeignKey
ALTER TABLE `publication_category` DROP FOREIGN KEY `publication_category_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `publication_category` DROP FOREIGN KEY `publication_category_publicationId_fkey`;

-- DropForeignKey
ALTER TABLE `request` DROP FOREIGN KEY `request_publicationId_fkey`;

-- DropForeignKey
ALTER TABLE `request` DROP FOREIGN KEY `request_workerUserId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `review_requestId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `review_reviewerId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `review_workerId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `user_addressId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `user_dniTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `user_category` DROP FOREIGN KEY `user_category_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `user_category` DROP FOREIGN KEY `user_category_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_validation` DROP FOREIGN KEY `user_validation_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_validation` DROP FOREIGN KEY `user_validation_validationLevelId_fkey`;

-- AlterTable
ALTER TABLE `address` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `category` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `conversation` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `requestId` VARCHAR(191) NOT NULL,
    MODIFY `initiatorId` VARCHAR(191) NOT NULL,
    MODIFY `receiverId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `dni_type` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `publication` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `publication_category` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL,
    MODIFY `publicationId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `request` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `workerUserId` VARCHAR(191) NOT NULL,
    MODIFY `publicationId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `review` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `requestId` VARCHAR(191) NOT NULL,
    MODIFY `reviewerId` VARCHAR(191) NOT NULL,
    MODIFY `workerId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `addressId` VARCHAR(191) NOT NULL,
    MODIFY `dniTypeId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user_category` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user_validation` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `validationLevelId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `validation_level` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_dniTypeId_fkey` FOREIGN KEY (`dniTypeId`) REFERENCES `dni_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_validation` ADD CONSTRAINT `user_validation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_validation` ADD CONSTRAINT `user_validation_validationLevelId_fkey` FOREIGN KEY (`validationLevelId`) REFERENCES `validation_level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_category` ADD CONSTRAINT `user_category_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_category` ADD CONSTRAINT `user_category_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publication` ADD CONSTRAINT `publication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publication_category` ADD CONSTRAINT `publication_category_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publication_category` ADD CONSTRAINT `publication_category_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `publication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request` ADD CONSTRAINT `request_workerUserId_fkey` FOREIGN KEY (`workerUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request` ADD CONSTRAINT `request_publicationId_fkey` FOREIGN KEY (`publicationId`) REFERENCES `publication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_initiatorId_fkey` FOREIGN KEY (`initiatorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
