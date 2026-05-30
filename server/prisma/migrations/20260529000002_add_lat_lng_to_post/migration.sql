-- AlterTable: add latitude and longitude columns to Post
ALTER TABLE `Post` ADD COLUMN `latitude` DOUBLE NULL;
ALTER TABLE `Post` ADD COLUMN `longitude` DOUBLE NULL;
