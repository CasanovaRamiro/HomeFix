-- Restore FK constraints and fix varchar sizes lost during the partial execution of 20260610024108_
--
-- Context: migration 20260610024108_ dropped all FK constraints and partially modified column types
-- (User, UserCategory, WorkerReview tables were not completed). This migration:
--   1. Fixes remaining varchar(36) columns that should be varchar(191)
--   2. Re-adds all 19 FK constraints that were dropped and never restored

SET FOREIGN_KEY_CHECKS=0;

-- Fix column sizes on User and all tables that reference User.id or were left at varchar(36)
ALTER TABLE `User` MODIFY `id` VARCHAR(191) NOT NULL;

ALTER TABLE `UserCategory`
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL;

ALTER TABLE `WorkerReview`
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `applicationId` VARCHAR(191) NOT NULL,
    MODIFY `reviewerId` VARCHAR(191) NOT NULL,
    MODIFY `workerId` VARCHAR(191) NOT NULL;

ALTER TABLE `Post` MODIFY `parentPostId` VARCHAR(191) NULL;

-- telegram_link_code.userId must match the new User.id size
ALTER TABLE `telegram_link_code` MODIFY `userId` VARCHAR(191) NOT NULL;

-- Restore FK constraints: User relations
ALTER TABLE `User` ADD CONSTRAINT `User_national_id_type_id_fkey` FOREIGN KEY (`national_id_type_id`) REFERENCES `national_id_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `User` ADD CONSTRAINT `User_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `address`(`address_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restore FK constraints: Post relations
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Post` ADD CONSTRAINT `Post_parentPostId_fkey` FOREIGN KEY (`parentPostId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Restore FK constraints: PostCategory relations
ALTER TABLE `PostCategory` ADD CONSTRAINT `PostCategory_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PostCategory` ADD CONSTRAINT `PostCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Restore FK constraints: UserCategory relations
ALTER TABLE `UserCategory` ADD CONSTRAINT `UserCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserCategory` ADD CONSTRAINT `UserCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Restore FK constraints: JobApplication relations
ALTER TABLE `JobApplication` ADD CONSTRAINT `JobApplication_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `JobApplication` ADD CONSTRAINT `JobApplication_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Restore FK constraints: WorkerReview relations
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restore FK constraints: Application relations
ALTER TABLE `Application` ADD CONSTRAINT `Application_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Application` ADD CONSTRAINT `Application_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Restore FK constraints: ClientReview relations
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ClientReview` ADD CONSTRAINT `ClientReview_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restore FK constraints: PostImage relations
ALTER TABLE `PostImage` ADD CONSTRAINT `PostImage_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS=1;
