-- Step 1: Drop foreign keys first (required before renaming referenced columns)
ALTER TABLE `Application` DROP FOREIGN KEY `Postulacion_trabajadorId_fkey`;
ALTER TABLE `Application` DROP FOREIGN KEY `Postulacion_postId_fkey`;

-- Step 2: Drop old unique index
DROP INDEX `Postulacion_trabajadorId_postId_key` ON `Application`;

-- Step 3: Rename columns (no FK constraints blocking now)
ALTER TABLE `Application` CHANGE COLUMN `trabajadorId` `workerId` VARCHAR(36) NOT NULL;
ALTER TABLE `Application` CHANGE COLUMN `estado` `status` VARCHAR(191) NOT NULL DEFAULT 'Pending';

-- Step 4: Recreate unique index with new name
CREATE UNIQUE INDEX `Application_workerId_postId_key` ON `Application`(`workerId`, `postId`);

-- Step 5: Recreate foreign keys with new names
ALTER TABLE `Application` ADD CONSTRAINT `Application_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Application` ADD CONSTRAINT `Application_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
