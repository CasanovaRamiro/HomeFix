# Ofix — Client

React frontend for the Ofix application.

## Tech Stack

- **Framework**: React 19
- **Build tool**: Vite
- **Routing**: React Router v7
- **HTTP client**: Axios

## Project Structure

```
client/
└── src/
    ├── main.jsx          ← App entry point
    ├── App.jsx           ← Router setup and route definitions
    ├── index.css         ← Global styles
    ├── views/
    │   ├── Login.jsx     ← Login page
    │   ├── Register.jsx  ← Registration page
    │   └── Users.jsx     ← Protected users list
    └── services/
        └── api.js        ← Axios instance with JWT interceptor
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> The server must be running at `http://localhost:3000` for API calls to work.

## Routes

| Path | Access | Description |
|---|---|---|
| `/login` | Public | Login form |
| `/register` | Public | Registration form |
| `/users` | Protected | List of all users |

Any unauthenticated request to a protected route redirects to `/login`. Logging out clears the token and redirects to `/login`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR on port 5173 |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |
