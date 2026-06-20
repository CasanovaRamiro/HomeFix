-- Add subcontractGroupId to Post
ALTER TABLE Post ADD COLUMN subcontractGroupId VARCHAR(191) NULL;

-- Add categoryId to Application
ALTER TABLE Application ADD COLUMN categoryId VARCHAR(191) NULL;

-- Add subcontractGroupId to Application
ALTER TABLE Application ADD COLUMN subcontractGroupId VARCHAR(191) NULL;

-- Unique application per (worker, post, category); COALESCE collapses NULL categoryId so regular
-- applications are de-duplicated too. Created before dropping the old unique to keep the workerId FK
-- covered (avoids MySQL errno 150). Requires MySQL 8.0.13+.
CREATE UNIQUE INDEX Application_workerId_postId_categoryId_key
  ON Application (workerId, postId, (COALESCE(categoryId, '__none__')));

DROP INDEX Application_workerId_postId_key ON Application;
