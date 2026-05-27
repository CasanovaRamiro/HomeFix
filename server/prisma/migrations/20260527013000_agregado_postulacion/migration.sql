-- CreateTable
CREATE TABLE `Postulacion` (
    `id` VARCHAR(36) NOT NULL,
    `trabajadorId` VARCHAR(36) NOT NULL,
    `postId` VARCHAR(36) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Pendiente',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Postulacion_trabajadorId_postId_key`(`trabajadorId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Postulacion` ADD CONSTRAINT `Postulacion_trabajadorId_fkey` FOREIGN KEY (`trabajadorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postulacion` ADD CONSTRAINT `Postulacion_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
