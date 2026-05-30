-- Check existing data to use valid IDs
SELECT id, name FROM User LIMIT 5;
SELECT id, title FROM Post LIMIT 5;
SELECT id, workerId, postId, status FROM Application LIMIT 10;
