-- Create ClientReview table for worker-to-client reviews
CREATE TABLE `ClientReview` (
    `id` VARCHAR(36) NOT NULL,
    `applicationId` VARCHAR(36) NOT NULL,
    `reviewerId` VARCHAR(36) NOT NULL,
    `clientId` VARCHAR(36) NOT NULL,
    `description` TEXT NOT NULL,
    `rating` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ClientReview_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
