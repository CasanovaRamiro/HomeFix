# AGENTS.md

## Project Overview

HomeFix is a full-stack web application that connects clients with home service professionals to solve household problems and service needs.

The project uses:
- React + Vite for the frontend
- Node.js + Express for the backend
- Prisma ORM
- MySQL
- JWT authentication

The current project priority is focused on backend development, business logic, API design, authentication, and testing.

Completely ignore the `client2` folder.

---

## Project Structure

```txt
Ofix/
├── client/      # Main frontend
├── client2/     # Ignore completely
└── server/      # Express + Prisma backend
```

The AI should focus primarily on `server/`.

---

## Backend Architecture Rules

The backend follows a layered and decoupled architecture.

Required flow:

```txt
Route → Controller → Service → Prisma
```

Rules:
- Controllers should only handle request/response logic.
- Business logic belongs in services.
- Do not access Prisma directly from controllers.
- Keep responsibilities clearly separated.
- Reuse existing patterns before introducing new ones.

Avoid unnecessary refactors or large structural changes.

---

## Backend Conventions

### Code
- Prioritize readability and maintainability.
- Avoid overengineering.
- Keep functions small and easy to understand.
- Follow the existing project style and patterns.

### Naming
- Use clear and descriptive names.
- Maintain consistency with existing naming conventions.
- Avoid unnecessary abbreviations.

### API
- Keep response structures consistent.
- Use proper HTTP status codes.
- Validate input data before processing.
- Handle errors in a controlled and predictable way.

### Prisma
- Reuse existing query patterns whenever possible.
- Avoid unnecessary database queries.
- Keep model relations explicit and clear.

---

## Testing Rules

Testing is an important part of the backend.

The AI should:
- Prioritize service and controller tests.
- Cover both success and failure scenarios.
- Mock external dependencies when appropriate.
- Test business behavior instead of internal implementation details.
- Keep tests simple and readable.

Do not generate unnecessarily complex tests.

---

## TypeScript Rules

TypeScript is mandatory across the backend.

Rules:
- Avoid using `any`.
- Prefer explicit and reusable types.
- Use interfaces/types consistent with the domain.
- Maintain strong typing in requests, responses, and services.
- Do not disable TypeScript validations unnecessarily.
- Prefer inference only when the type is completely obvious.
- Separate API types, domain types, and database types when necessary.

---

## Backend Organization

When creating new backend features, prefer the following structure:

```txt
module/
├── controller
├── service
├── routes
├── validations
├── tests
└── utils (only if necessary)
```

Reuse existing structures before creating new folders or patterns.

---

## Error Handling

- Do not use `console.log` as the main error handling mechanism.
- Throw controlled and consistent errors.
- Keep debugging messages clear and useful.
- Avoid exposing sensitive information in HTTP responses.
- Centralize error handling whenever possible.

---

## Security Rules

- Always validate incoming data.
- Never trust client-side input.
- Maintain validation at both API and business logic levels.
- Protect private routes using JWT.
- Never hardcode secrets or credentials.
- Use environment variables for sensitive configuration.

---

## AI Working Rules

Before generating code:
- Analyze the existing structure first.
- Understand and follow the current module pattern.
- Maintain consistency with the existing project architecture.
- Analyze existing files before modifying them.

The AI must NOT:
- Rewrite entire modules unnecessarily.
- Introduce new architectures without context.
- Add heavy dependencies without clear justification.
- Modify unrelated files.

The AI should:
- Prefer incremental improvements over full rewrites.
- Explain important technical decisions.
- Ask for context before large structural changes.
- Behave as a collaborative backend developer.

---

## Project Philosophy

HomeFix prioritizes:
- simplicity,
- maintainability,
- gradual scalability,
- user experience,
- and architectural clarity.

Solutions should remain realistic for an MVP-level academic/professional project and avoid unnecessary enterprise-level complexity.

---

## AGENT Objective

This file exists to help AI tools:
- understand the project architecture,
- respect existing conventions,
- generate consistent code,
- avoid destructive refactors,
- and accelerate backend development for HomeFix.