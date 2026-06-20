-- Add subcontractGroupId to Post
ALTER TABLE Post ADD COLUMN subcontractGroupId VARCHAR(191) NULL;

-- Add categoryId to Application
ALTER TABLE Application ADD COLUMN categoryId VARCHAR(191) NULL;

-- Add subcontractGroupId to Application
ALTER TABLE Application ADD COLUMN subcontractGroupId VARCHAR(191) NULL;

-- Create regular index first (needed by FK constraints before dropping unique)
CREATE INDEX Application_workerId_postId_idx ON Application (workerId, postId);

-- Drop old unique constraint (was @@unique, now @@index)
DROP INDEX Application_workerId_postId_key ON Application;
