# AGENTS.md

## Project Overview

HomeFix is a full-stack web application that connects clients with home service professionals to solve household problems and service requests.

Current project priorities:
- backend architecture,
- business logic,
- authentication,
- API consistency,
- Prisma integration,
- and testing quality.

---

## Tech Stack

### Frontend
- React
- Vite
- TailwindCSS

### Backend
- Node.js
- Express 5
- TypeScript 5 (strict mode)
- Prisma ORM
- MySQL
- JWT Authentication
- bcryptjs

### Testing
- Vitest
- Supertest

### Environment
- ESM modules
- pnpm package manager

---

## Project Structure

```txt
Ofix/
├── client/
└── server/
```

Important backend structure:

```txt
server/src/
├── index.ts
├── lib/
│   ├── env.ts
│   └── prisma.ts
├── middleware/
├── routes/
├── services/
├── data/
├── types/
└── test/
```

The AI should focus primarily on the `server/` folder.

---

## Backend Architecture Rules

The backend follows a layered architecture for APIs, not traditional MVC.

Required request flow:

```txt
HTTP Request
→ Route
→ Service
→ Data Layer
→ Prisma
→ MySQL
```

Layer responsibilities:

### Routes
Handle HTTP concerns only:
- request parsing
- response formatting
- status codes
- middleware integration
- forwarding errors to Express middleware

### Services
Contain all business logic:
- validations
- authentication logic
- token generation
- business rules

### Data Layer
Handles database access exclusively:
- Prisma queries
- field selection
- database persistence

Rules:
- Never place business logic inside routes.
- Never access Prisma outside the data layer.
- Keep layers isolated and testable.
- Reuse existing patterns before introducing new abstractions.

Avoid unnecessary refactors or enterprise-level complexity.

---

## TypeScript Rules

TypeScript is mandatory across the backend.

Rules:
- Never use `any`.
- Prefer explicit and reusable types.
- Keep strong typing in requests, responses, services, and JWT payloads.
- Reuse existing interfaces and DTOs when possible.
- Do not disable strict TypeScript checks.
- Prefer type safety over quick fixes.

---

## Backend Conventions

### Code
- Prioritize readability and maintainability.
- Keep functions small and focused.
- Avoid overengineering.
- Follow the existing project style and folder structure.

### API
- Keep response structures consistent.
- Use proper HTTP status codes.
- Validate input data before processing.
- Return controlled and predictable errors.

### Validation Rules
- Input validation belongs at the route boundary.
- Business validation belongs in services.
- Never trust raw request bodies inside services.

### Prisma
- Reuse existing query patterns.
- Avoid unnecessary database queries.
- Never return full Prisma models directly from the API.
- Always explicitly select safe public fields.
- Keep Prisma access isolated inside the data layer.

---

## Authentication Rules

Authentication uses JWT.

Rules:
- Passwords must always be hashed using bcrypt.
- Never expose password fields in API responses.
- Login responses must not reveal whether an email exists.
- Protected routes must use the authentication middleware.
- JWT secrets must come from environment variables only.

---

## Error Handling

- Use centralized error handling middleware.
- Never use `console.log` as primary error handling.
- Throw controlled and consistent errors.
- Avoid exposing sensitive internal details in responses.
- Use `next(error)` for Express error propagation.

---

## Testing Rules

Testing is an important part of the backend architecture.

The AI should:
- Prioritize service, route, and integration tests.
- Cover both success and failure scenarios.
- Mock external dependencies when appropriate.
- Test business behavior instead of implementation details.
- Keep tests readable and maintainable.

Test structure includes:
- unit tests
- integration tests
- e2e tests

---

## Security Rules

- Always validate incoming data.
- Never trust client-side input.
- Never hardcode secrets or credentials.
- Use environment variables for sensitive configuration.
- Keep authentication and authorization checks explicit.
- Prevent sensitive field exposure in API responses.

---

## Adding New Features

When creating a new entity/module, follow this order:

```txt
schema.prisma
→ data layer
→ service
→ route
→ register route in index.ts
→ tests
```

Preferred structure:

```txt
module/
├── data
├── service
├── routes
├── tests
└── types
```

Reuse existing structures before introducing new patterns.

---

## AI Working Rules

Before generating code:
- Analyze the existing structure first.
- Follow the current module pattern.
- Respect existing architecture and naming conventions.
- Analyze related files before modifying them.

The AI must NOT:
- Rewrite unrelated files.
- Introduce new architectures without context.
- Add unnecessary dependencies.
- Bypass the service or data layer.
- Generate large refactors without explicit request.

The AI should:
- Prefer incremental improvements.
- Keep solutions pragmatic and MVP-friendly.
- Behave as a collaborative backend developer.
- Prefer existing dependencies before adding new libraries.

---

## Project Philosophy

HomeFix prioritizes:
- simplicity,
- maintainability,
- gradual scalability,
- architectural clarity,
- and realistic MVP development.

Avoid unnecessary enterprise-grade abstractions or overengineered solutions.

---

## AGENT Objective

This file exists to help AI tools:
- understand the backend architecture,
- respect project conventions,
- generate consistent TypeScript code,
- avoid destructive refactors,
- and accelerate backend development for HomeFix.