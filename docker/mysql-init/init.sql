-- Runs once on first DB container init. Creates the test DB used by `pnpm db:migrate:test`
-- and Vitest, alongside the main ofix_db created via MYSQL_DATABASE.
CREATE DATABASE IF NOT EXISTS ofix_test;
GRANT ALL PRIVILEGES ON ofix_test.* TO 'ofix'@'%';
FLUSH PRIVILEGES;
