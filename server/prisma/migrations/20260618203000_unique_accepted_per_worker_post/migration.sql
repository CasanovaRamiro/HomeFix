-- Add virtual column to enable partial unique constraint
-- (MySQL unique indexes allow multiple NULLs, so non-Accepted rows are not constrained)
ALTER TABLE Application ADD COLUMN accepted_status VARCHAR(8) 
  GENERATED ALWAYS AS (CASE WHEN status = 'Accepted' THEN status ELSE NULL END) VIRTUAL;

CREATE UNIQUE INDEX Application_unique_accepted 
ON Application (workerId, postId, accepted_status);
