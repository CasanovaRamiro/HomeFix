# HomeFix

Full-stack web application with a React + Vite frontend and a Node.js + Express + Prisma + MySQL backend.

## Project Structure

```
HomeFix/
├── client/   ← React + Vite (port 5173)
└── server/   ← Express + Prisma + MySQL (port 3000)
```
Desde raíz se puede levantar con estos 2 comandos
pnpm dev-fe	Inicia el frontend (client)
pnpm dev-be	Inicia el backend (server)

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A running MySQL instance
- pnpm

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd HomeFix
```

### 2. Set up the server

```bash
cd server
pnpm install
```

Open `server/.env` and fill in your database connection:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
PORT=3000
JWT_SECRET=your_secret_here
```

Run the database migrations:

```bash
pnpm run db:migrate -- --name init
```

Start the server:

```bash
pnpm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Set up the client

Open a new terminal:

```bash
cd client
pnpm install
pnpm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

### Server (`/server`)

| Command | Description |
|---|---|
| `pnpm run dev` | Start server with hot reload (nodemon) |
| `pnpm start` | Start server in production mode |
| `pnpm run db:migrate -- --name <name>` | Create and apply a new migration |
| `pnpm run db:generate` | Regenerate the Prisma client |

### Client (`/client`)

| Command | Description |
|---|---|
| `pnpm run dev` | Start dev server with HMR |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview the production build |
