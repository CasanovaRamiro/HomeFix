/*
  Warnings:

  - You are about to alter the column `type` on the `post` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - The primary key for the `telegram_link_code` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `telegramChatId` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- DropForeignKey
ALTER TABLE `telegram_link_code` DROP FOREIGN KEY `TelegramLinkCode_userId_fkey`;

-- AlterTable
ALTER TABLE `post` MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'client',
    MODIFY `parentPostId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `postcategory` MODIFY `roleDescription` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `telegram_link_code` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `code` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` MODIFY `telegramChatId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_parentPostId_fkey` FOREIGN KEY (`parentPostId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `PostCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telegram_link_code` ADD CONSTRAINT `telegram_link_code_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `telegram_link_code` RENAME INDEX `TelegramLinkCode_code_key` TO `telegram_link_code_code_key`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `telegramChatId` TO `User_telegramChatId_key`;
