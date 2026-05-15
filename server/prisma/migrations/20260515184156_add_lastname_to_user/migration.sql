/*
  Warnings:

  - Added the required column `lastname` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `lastname` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(191) NULL;
