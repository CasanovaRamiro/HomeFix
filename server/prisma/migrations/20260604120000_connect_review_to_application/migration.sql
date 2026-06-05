-- Drop WorkerReview and recreate with applicationId referencing Application
DROP TABLE IF EXISTS `WorkerReview`;

CREATE TABLE `WorkerReview` (
    `id` VARCHAR(36) NOT NULL,
    `applicationId` VARCHAR(36) NOT NULL,
    `reviewerId` VARCHAR(36) NOT NULL,
    `workerId` VARCHAR(36) NOT NULL,
    `description` TEXT NOT NULL,
    `rating` INTEGER NOT NULL,
    `mediaUrls` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WorkerReview_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
