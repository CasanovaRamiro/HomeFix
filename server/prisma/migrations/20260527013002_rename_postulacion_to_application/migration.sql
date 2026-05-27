-- Rename table Postulacion → Application
RENAME TABLE `Postulacion` TO `Application`;

-- Rename column trabajadorId → workerId
ALTER TABLE `Application` CHANGE COLUMN `trabajadorId` `workerId` VARCHAR(36) NOT NULL, ALGORITHM=INPLACE, LOCK=NONE;

-- Rename column estado → status, change default to English
ALTER TABLE `Application` CHANGE COLUMN `estado` `status` VARCHAR(191) NOT NULL DEFAULT 'Pending', ALGORITHM=INPLACE, LOCK=NONE;

-- Drop old unique index and recreate with new name
DROP INDEX `Postulacion_trabajadorId_postId_key` ON `Application`;
CREATE UNIQUE INDEX `Application_workerId_postId_key` ON `Application`(`workerId`, `postId`);

-- Drop old foreign keys and recreate with new names
ALTER TABLE `Application` DROP FOREIGN KEY `Postulacion_trabajadorId_fkey`;
ALTER TABLE `Application` DROP FOREIGN KEY `Postulacion_postId_fkey`;

ALTER TABLE `Application` ADD CONSTRAINT `Application_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Application` ADD CONSTRAINT `Application_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
