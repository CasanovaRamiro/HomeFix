# HomeFix — Server

REST API built with Node.js, Express, Prisma and MySQL.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express 5
- **ORM**: Prisma 5
- **Database**: MySQL
- **Auth**: Auth0 (RS256 JWT)

## Project Structure

```
server/
├── src/
│   ├── index.js            ← Entry point, route registration
│   ├── lib/
│   │   └── prisma.js       ← Prisma client singleton
│   ├── routes/             ← HTTP layer (request/response only)
│   │   ├── auth.routes.js
│   │   └── user.routes.js
│   ├── services/           ← Business logic
│   │   ├── auth.service.js
│   │   └── user.service.js
│   ├── data/               ← Database queries via Prisma
│   │   └── user.data.js
│   └── middleware/
│       └── auth.middleware.js ← JWT verification
└── prisma/
    ├── schema.prisma       ← Data models
    └── migrations/         ← SQL migration history
```

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `.env` using the required variables and service configuration in the [root installation guide](../README.md#2-set-up-the-server). The catalog initialization itself only needs `DATABASE_URL`; starting the API also requires the Auth0, Gemini and Cloudinary settings listed there.

### 3. Apply migrations and initialize categories

```bash
pnpm run db:setup
```

If pnpm is unavailable and dependencies are already installed, use `npm run db:setup` from this directory. Both commands use the local Prisma and tsx executables.

This applies the existing migrations, then adds missing initial categories without deleting records or changing existing category IDs. On an already migrated database, `pnpm run db:seed` is sufficient. Both commands can be repeated safely.

`pnpm run db:seed:demo` is a separate, destructive demo generator. It deletes application data and must only target a disposable database.

Check `GET /categories` after startup: it should return the initial trades so that worker registration can select specialties.

### 4. Start the server

```bash
pnpm run dev
```

## API Reference

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password, phone? }` | Create account, returns JWT |
| POST | `/auth/login` | `{ email, password }` | Login, returns JWT |

### Users

All user endpoints require the header: `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload (nodemon) |
| `npm start` | Start in production mode |
| `npm run db:migrate -- --name <name>` | Create and apply a migration |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `pnpm run db:setup` | Apply existing migrations and safely initialize the category catalog |
| `pnpm run db:seed` | Add missing categories while preserving existing data |
| `pnpm run db:seed:demo` | Delete application data and recreate a disposable demo |

## Adding a New Migration

1. Edit `prisma/schema.prisma` with your changes
2. Run:
```bash
npm run db:migrate -- --name describe_your_change
```

This generates a SQL file in `prisma/migrations/` and applies it.
