-- Add type column to PostImage table
ALTER TABLE `PostImage` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'image';