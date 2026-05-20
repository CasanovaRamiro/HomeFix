# Ofix — Server

REST API built with Node.js, Express, Prisma and MySQL.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express 5
- **ORM**: Prisma 5
- **Database**: MySQL
- **Auth**: JWT + bcrypt

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
npm install
```

### 2. Configure environment

Copy or edit `.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
PORT=3000
JWT_SECRET=your_secret_here
```

### 3. Run migrations

```bash
npm run db:migrate -- --name init
```

### 4. Start the server

```bash
npm run dev
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

## Adding a New Migration

1. Edit `prisma/schema.prisma` with your changes
2. Run:
```bash
npm run db:migrate -- --name describe_your_change
```

This generates a SQL file in `prisma/migrations/` and applies it.
