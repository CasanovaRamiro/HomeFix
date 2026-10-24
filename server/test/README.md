# Server tests: database isolation

`npm test` (or `npm run test:unit`) runs only mock/pure suites in `test/service`,
`test/middleware`, `test/safety` and `test/data/*.unit.test.ts`. Its Vitest
configuration supplies an unusable database URL. Route and persistence suites
require `npm run test:db`; they **delete all data in their test database**.

## Dedicated local MySQL database

The following provisioning example is **only for a new, empty database** on a
server you own. Do not rerun it for an already provisioned `ofix_hf_tests`,
`ofix_test`, or a development DB.
Enter passwords interactively; choose a new random password, not a dev password.

```powershell
mysql --protocol=TCP --host=127.0.0.1 --port=3306 --user=root --password
```

```sql
CREATE DATABASE `ofix_hf_tests`;
CREATE USER 'hf_test_runner'@'localhost' IDENTIFIED BY '<NEW_RANDOM_PASSWORD>';
CREATE USER 'hf_test_runner'@'127.0.0.1' IDENTIFIED BY '<NEW_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON `ofix_hf_tests`.* TO 'hf_test_runner'@'localhost';
GRANT ALL PRIVILEGES ON `ofix_hf_tests`.* TO 'hf_test_runner'@'127.0.0.1';
```

The account must have **no global, other-database, role or grant-option privileges**.
Use the same fresh password for both local-only principals. `CREATE DATABASE`
must fail if the schema already exists: investigate instead of reusing it.

Before any schema preparation or DB test, identify the server and account via
read-only queries, connecting **as the new test user**:

```powershell
mysql --protocol=TCP --host=127.0.0.1 --port=3306 --user=hf_test_runner --password ofix_hf_tests
```

```sql
SELECT DATABASE(), CURRENT_USER(), @@server_uuid, @@port;
SHOW GRANTS FOR CURRENT_USER();
SHOW TABLES;
```

Confirm the selected schema is new/empty, that `CURRENT_USER()` is one of the
two local-only principals, and record `@@server_uuid` separately. Compare the
server identity with the intended local MySQL instance and check that the
grants mention only `ofix_hf_tests` (aside from global `USAGE`). A loopback
address or a schema name is not proof of isolation; confirm ownership of the
instance and that nobody else uses the schema.

In a dedicated PowerShell session, enter the existing password without echoing
it or placing it in a command or shell history. The URL is kept only in that
session's process environment (and inherited by its test processes); do not
save it in `.env`, transcripts, or versioned files. Do not print the URL.
Start a fresh session with no inherited `DATABASE_URL`; never change a
development or production `.env` to run tests.

```powershell
if (Test-Path Env:DATABASE_URL) { throw 'Usá una sesión nueva sin DATABASE_URL heredada' }
$secure = Read-Host 'Contraseña de hf_test_runner (sin eco)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $encoded = [Uri]::EscapeDataString($plain)
  $env:HF_TEST_DB_URL = "mysql://hf_test_runner:${encoded}@127.0.0.1:3306/ofix_hf_tests"
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Variable secure,ptr,plain,encoded -ErrorAction SilentlyContinue
}
$env:HF_TEST_DB_TARGET='127.0.0.1:3306'
$env:HF_TEST_DB_PRINCIPAL='hf_test_runner@localhost' # Must match CURRENT_USER()
$env:HF_TEST_DB_SERVER_UUID='<UUID_FROM_READ_ONLY_QUERY>' # Pin the intended local instance
$env:HF_TEST_DB_CONFIRM='I_AUTHORIZE_DISPOSABLE_HF_TESTS'
```

Do not configure these variables in a shared shell. When finished, close that
shell to clear its environment. Never display the URL or dump environment
variables into logs. The guard refuses missing/mismatched variables before
connecting; only `test:db` and `db:migrate:test` are allowed to target this
database, after explicit approval to write.

Only after these checks and explicit permission to write to the disposable DB:

```powershell
npm run db:migrate:test
npm run test:db
```

The migration script verifies the same account, instance UUID, port, schema and
grants **before** running `prisma db push`; it does not use `--accept-data-loss`.
Vitest's DB-specific config and `cleanDb()` repeat the verification. If a check
fails, do not retry with a development/production account. Running `vitest`
with a different config or invoking Prisma scripts outside these commands is
not covered by the test guard.

CI uses its own ephemeral MySQL service with a dedicated schema and account.
Its `@%` principal is accepted only under `CI=true`, after server-UUID and
schema/grant checks; local use requires a local-only principal.
