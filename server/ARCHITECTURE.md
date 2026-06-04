# Backend Architecture Guide

This backend uses a strict three-layer architecture. Every file belongs to exactly one layer. Follow the rules below when reading, editing, or adding code.

---

## Layer Overview

```
src/
├── lib/                        shared utilities (prisma client, env, errors)
├── infrastructure/             everything that touches external systems
│   ├── database/               Prisma queries — own select constants, call transformers, return domain types
│   ├── transformers/           Prisma shape → domain type (flatten nesting, no date serialization)
│   ├── types/                  internal Prisma-shaped types (never exported outside infrastructure)
│   └── providers/              raw Auth0 and Gemini API calls
├── domain/
│   ├── types/                  domain types (Date objects, clean shapes — no Prisma, no ISO strings)
│   └── services/               business logic — receive domain types, return domain types
└── presentation/
    ├── types/                  DTOs (dates as ISO strings), request body shapes, AI message types
    ├── transformers/           domain type → DTO (Date → ISO string, only when needed)
    ├── middleware/             auth0.middleware.ts, error.middleware.ts
    └── routes/                 Express handlers — call services, call transformers, call res.json()
```

---

## Import Rules

Each layer may only import downward. Never import upward.

| From | May import from |
|---|---|
| `presentation/routes` | `domain/services`, `presentation/transformers`, `presentation/types`, `presentation/middleware`, `lib/` |
| `presentation/transformers` | `domain/types`, `presentation/types` |
| `domain/services` | `infrastructure/database`, `infrastructure/providers`, `domain/types`, `lib/` |
| `infrastructure/database` | `infrastructure/transformers`, `infrastructure/types`, `domain/types`, `lib/` |
| `infrastructure/transformers` | `infrastructure/types`, `domain/types` |
| `infrastructure/providers` | `infrastructure/types`, `lib/` |

**Hard rules:**
- Domain services never import from `@prisma/client`.
- Domain services never import from `infrastructure/types/`.
- Routes never import from `@prisma/client` or `infrastructure/`.

---

## The Transformer Contract

### Infrastructure transformers (Prisma → Domain)
- Live in `infrastructure/transformers/`
- Called by database functions before returning
- Flatten Prisma nesting: `categories: [{ category: { id, name } }]` → `categories: [{ id, name }]`
- Never serialize dates (keep `Date` objects)

### Presentation transformers (Domain → DTO)
- Live in `presentation/transformers/`
- Called by routes before `res.json()`
- Only created when domain types have `Date` fields that need ISO string serialization
- Current ones: `post.transformer.ts`, `application.transformer.ts`
- **Not needed** when a domain type has no `Date` fields, or when Express auto-serialization is acceptable (workers, dashboard, auth responses)

---

## Adding a New Feature — Step by Step

Say you're adding `review` endpoints:

1. **`domain/types/review.types.ts`** — define `DomainReview` with `Date` fields
2. **`infrastructure/types/review.types.ts`** — define the raw Prisma result shape (if complex nesting)
3. **`infrastructure/transformers/review.transformer.ts`** — `PrismaReview → DomainReview`
4. **`infrastructure/database/review.database.ts`** — query Prisma, call transformer, return `DomainReview`
5. **`domain/services/review.service.ts`** — business logic, calls database functions
6. **`presentation/types/review.types.ts`** — `ReviewDTO` if dates need serialization
7. **`presentation/transformers/review.transformer.ts`** — `DomainReview → ReviewDTO` (only if needed)
8. **`presentation/routes/review.routes.ts`** — call service, call transformer, `res.json(dto)`
9. **`src/index.ts`** — register the new router

---

## What Belongs Where — Quick Reference

| Thing | Where |
|---|---|
| Prisma `select` constant | `infrastructure/database/*.database.ts` |
| Prisma result type (`UserGetPayload`) | `infrastructure/database/*.database.ts` (exported alongside the select) |
| Auth0 HTTP calls (`fetch`) | `infrastructure/providers/auth0.provider.ts` |
| Gemini API calls | `infrastructure/providers/ai.provider.ts` |
| Business rules / guards (404, 403) | `domain/services/` |
| Date → ISO string serialization | `presentation/transformers/` |
| Request body validation (missing fields) | `presentation/routes/` |
| Deep input validation (date range, field rules) | `domain/services/` |
| `createHttpError` | `lib/errors.ts` |
| `UserRole` enum | `domain/types/userRole.ts` |

---

## Concrete Examples

### Database function — always transforms before returning
```ts
// infrastructure/database/post.database.ts
export const findPostById = async (id: string): Promise<DomainPost | null> => {
  const raw = await prisma.post.findUnique({ where: { id }, select: postFields })
  return raw ? toDomainPost(raw) : null   // ← transformer called here
}
```

### Domain service — only domain types, no Prisma
```ts
// domain/services/post.service.ts
export const getPostById = (id: string): Promise<DomainPost | null> =>
  findPostById(id)   // receives DomainPost, never Prisma.Post
```

### Route — transforms domain type to DTO before responding
```ts
// presentation/routes/post.routes.ts
const result = await getPostById(req.params.id)
if (!result) return res.status(404).json({ error: 'Post not found' })
res.json(toPostDTO(result))   // ← Date fields serialized to ISO strings here
```

### Mutation endpoint — returns minimal clean type, no full post needed
```ts
// infrastructure/database/post.database.ts
export const updatePostStatus = (id: string, status: string): Promise<{ id: string; status: string }> =>
  prisma.post.update({ where: { id }, data: { status }, select: { id: true, status: true } })
```

---

## Current Presentation Transformers

| Transformer | When to call |
|---|---|
| `toPostDTO(post: DomainPost)` | any route returning a post to the client |
| `toUserPostDTO(post: DomainUserPost)` | routes returning user's own posts |
| `toMyApplicationDTO(app: DomainMyApplication)` | `GET /applications/my-applications` |

Routes that do **not** call a transformer (no date serialization needed): workers, auth `/me`, categories, dashboard, application accept/reject/apply responses.
