-- Add telegram fields to User
ALTER TABLE `User` ADD COLUMN `telegramChatId` VARCHAR(255) NULL UNIQUE;
ALTER TABLE `User` ADD COLUMN `telegramLinkedAt` DATETIME(3) NULL;

-- Create telegram_link_code table
CREATE TABLE `telegram_link_code` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `TelegramLinkCode_code_key` (`code`),
    INDEX `TelegramLinkCode_userId_fkey` (`userId`),
    CONSTRAINT `TelegramLinkCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
