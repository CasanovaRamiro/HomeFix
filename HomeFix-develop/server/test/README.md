# Server Tests

## Running Tests

### Prerequisites

- MySQL running with an `ofix_test` database
- Migrations applied to the test DB:

```bash
npm run db:migrate:test
```

### Commands

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file change)
npm run test:watch
```

---

## Structure

```
test/
├── helpers/
│   └── db.js          ← Shared Prisma client + cleanDb utility
├── data/
│   └── user.data.test.js   ← Real DB
├── routes/
│   └── auth.test.js        ← Real DB + HTTP
└── service/
    └── auth.service.test.js ← Mocked
```

---

## Practices Applied

### Each layer is tested differently

| Layer | Approach | Reason |
|---|---|---|
| `service/` | Mocked data layer | Services contain pure business logic — no I/O needed to test it |
| `data/` | Real test DB | Verifies actual Prisma queries, field selection, and DB constraints |
| `routes/` | Real test DB + Supertest | Tests the full HTTP cycle: request parsing, auth, status codes, response shape |

### Separate test database

Tests run against `ofix_test`, never against the development database. This keeps test data isolated and lets the suite run destructively without risk.

The test DB URL is set in `vitest.config.js` and overrides `DATABASE_URL` automatically — no manual switching needed.

### Clean state before every test

Every test file calls `cleanDb()` in `beforeEach`, which truncates all tables. This means:

- Tests never depend on data left by a previous test
- Order of execution does not matter
- A failing test cannot corrupt the next one

### No mocks in data and route tests

Mocking the DB at the data or route level would hide real bugs — wrong field names, missing `select` clauses, constraint violations. These layers are tested against the real DB so Prisma queries are fully exercised.

### Services are always mocked

Services orchestrate logic, not I/O. Mocking the data layer in service tests keeps them fast, deterministic, and focused solely on business rules (e.g. "throws if email is taken", "hashes the password before saving").

---

## Adding a New Test

1. Identify the layer: is it logic (service), a query (data), or an endpoint (route)?
2. Create the file in the matching folder following the naming convention: `<name>.test.js`
3. Use `cleanDb()` in `beforeEach` if your test touches the DB
4. Mock only the layer directly below the one you are testing
