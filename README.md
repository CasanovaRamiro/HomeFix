# Ofix

Full-stack web application with a React + Vite frontend and a Node.js + Express + Prisma + MySQL backend.

## Project Structure

```
Ofix/
├── client/   ← React + Vite (port 5173)
└── server/   ← Express + Prisma + MySQL (port 3000)
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A running MySQL instance
- npm

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Ofix
```

### 2. Set up the server

```bash
cd server
npm install
```

Open `server/.env` and fill in your database connection:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
PORT=3000
JWT_SECRET=your_secret_here
```

Run the database migrations:

```bash
npm run db:migrate -- --name init
```

Start the server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Set up the client

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

### Server (`/server`)

| Command | Description |
|---|---|
| `npm run dev` | Start server with hot reload (nodemon) |
| `npm start` | Start server in production mode |
| `npm run db:migrate -- --name <name>` | Create and apply a new migration |
| `npm run db:generate` | Regenerate the Prisma client |

### Client (`/client`)

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
