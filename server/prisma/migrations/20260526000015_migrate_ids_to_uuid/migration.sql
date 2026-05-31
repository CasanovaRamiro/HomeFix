-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PostCategory` DROP FOREIGN KEY `PostCategory_postId_fkey`;

-- DropForeignKey
ALTER TABLE `PostCategory` DROP FOREIGN KEY `PostCategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `UserCategory` DROP FOREIGN KEY `UserCategory_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserCategory` DROP FOREIGN KEY `UserCategory_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `JobApplication` DROP FOREIGN KEY `JobApplication_workerId_fkey`;

-- DropForeignKey
ALTER TABLE `JobApplication` DROP FOREIGN KEY `JobApplication_postId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerReview` DROP FOREIGN KEY `WorkerReview_jobApplicationId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerReview` DROP FOREIGN KEY `WorkerReview_reviewerId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerReview` DROP FOREIGN KEY `WorkerReview_workerId_fkey`;

-- AlterTable: User
ALTER TABLE `User` MODIFY `id` VARCHAR(36) NOT NULL;

-- AlterTable: Post
ALTER TABLE `Post` MODIFY `id` VARCHAR(36) NOT NULL,
                  MODIFY `userId` VARCHAR(36) NOT NULL;

-- AlterTable: Category
ALTER TABLE `Category` MODIFY `id` VARCHAR(36) NOT NULL;

-- AlterTable: PostCategory
ALTER TABLE `PostCategory` MODIFY `id` VARCHAR(36) NOT NULL,
                           MODIFY `postId` VARCHAR(36) NOT NULL,
                           MODIFY `categoryId` VARCHAR(36) NOT NULL;

-- AlterTable: UserCategory
ALTER TABLE `UserCategory` MODIFY `id` VARCHAR(36) NOT NULL,
                           MODIFY `userId` VARCHAR(36) NOT NULL,
                           MODIFY `categoryId` VARCHAR(36) NOT NULL;

-- AlterTable: JobApplication
ALTER TABLE `JobApplication` MODIFY `id` VARCHAR(36) NOT NULL,
                             MODIFY `workerId` VARCHAR(36) NOT NULL,
                             MODIFY `postId` VARCHAR(36) NOT NULL;

-- AlterTable: WorkerReview
ALTER TABLE `WorkerReview` MODIFY `id` VARCHAR(36) NOT NULL,
                           MODIFY `jobApplicationId` VARCHAR(36) NOT NULL,
                           MODIFY `reviewerId` VARCHAR(36) NOT NULL,
                           MODIFY `workerId` VARCHAR(36) NOT NULL;

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
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_jobApplicationId_fkey` FOREIGN KEY (`jobApplicationId`) REFERENCES `JobApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkerReview` ADD CONSTRAINT `WorkerReview_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
