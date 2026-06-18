-- Add subcontractGroupId to Application for cross-position uniqueness within a subcontract group
ALTER TABLE Application ADD COLUMN subcontractGroupId VARCHAR(191) AFTER categoryId;

-- Backfill from Post for existing records
UPDATE Application a
JOIN Post p ON a.postId = p.id
SET a.subcontractGroupId = p.subcontractGroupId;

-- Remove duplicate Accepted applications within the same subcontract group (keep earliest)
DELETE a1 FROM Application a1
INNER JOIN Application a2
  ON a1.workerId = a2.workerId
  AND a1.subcontractGroupId = a2.subcontractGroupId
  AND a1.status = 'Accepted'
  AND a2.status = 'Accepted'
  AND a1.id > a2.id;

-- Partial unique index using the existing accepted_status virtual column
CREATE UNIQUE INDEX Application_unique_accepted_group 
ON Application (workerId, subcontractGroupId, accepted_status);

-- Add index for efficient lookup by subcontractGroupId
CREATE INDEX Application_subcontractGroupId_idx 
ON Application (subcontractGroupId);
