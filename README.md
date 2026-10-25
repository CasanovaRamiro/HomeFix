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

- [Node.js](https://nodejs.org/) 22.12 or higher (Docker and CI use Node 22)
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
CORS_ORIGIN=http://localhost:5173
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com/
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_DB_CONNECTION=Username-Password-Authentication
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Use credentials for your configured services. Auth0 must allow the database connection used for registration and login. Cloudinary and the other dependencies are installed by `pnpm install`.

Apply the existing migrations and initialize the category catalog:

```bash
pnpm run db:setup
```

If pnpm is not on your local PATH and dependencies are already installed, you can run `npm --prefix server run db:setup` from the repository root instead. The setup script uses the project's local Prisma and tsx executables and does not require a global pnpm installation.

`db:setup` applies migrations followed by the safe category seed. It adds these eight trades when missing: Electricidad, Plomería, Carpintería, Pintura, Albañilería, Cerrajería, Aire / HVAC and Electrónica. You can repeat it without changing existing category IDs or deleting accounts, posts, reviews or custom categories.

For an already migrated database, run only `pnpm run db:seed` to initialize missing trades. Docker development and Railway's pre-deploy step also use `db:setup`.

The optional **`pnpm run db:seed:demo` deletes existing application data** and recreates demonstration records. Use it only with a disposable development database; it is not part of installation.

Start the server:

```bash
pnpm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Set up the client

Open a new terminal. Create `client/.env` with the API URL (match the backend port):

```env
VITE_API_URL=http://localhost:3000
```

For Google login, also configure `VITE_AUTH0_DOMAIN` (including `https://`), `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE` and `VITE_AUTH0_CALLBACK_URL` for your Auth0 application.

```bash
cd client
pnpm install
pnpm run dev
```

The app will be available at `http://localhost:5173`.

Before registering a professional, verify that `GET http://localhost:3000/categories` returns the catalog, then open `/register/worker` and select a trade in step 2. If the catalog is empty, check the database URL and run the safe `db:seed`; if the request fails, check the backend and `VITE_API_URL`. The registration screen offers a retry without clearing the personal details already entered.

## Available Scripts

### Server (`/server`)

| Command | Description |
|---|---|
| `pnpm run dev` | Start server with hot reload (tsx) |
| `pnpm start` | Start server in production mode |
| `pnpm run db:migrate -- --name <name>` | Create and apply a new migration |
| `pnpm run db:generate` | Regenerate the Prisma client |
| `pnpm run db:setup` | Apply existing migrations and safely initialize categories |
| `pnpm run db:seed` | Add missing initial categories without deleting data |
| `pnpm run db:seed:demo` | Delete application data and recreate a disposable demo |

### Client (`/client`)

| Command | Description |
|---|---|
| `pnpm run dev` | Start dev server with HMR |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview the production build |
