# HomeFix

Aplicacion full-stack con React + Vite en el frontend y Node.js + Express + Prisma + MySQL en el backend.

## Estructura

```
HomeFix/
|- client/   React + Vite (puerto 5173)
|- server/   Express + Prisma + MySQL (puerto 3000)
`- scripts/  utilidades del proyecto
```

## Requisitos

- Node.js 22.12 o superior. CI usa Node.js 22 y las dependencias actuales requieren esta linea de Node.
- pnpm 11. CI instala exactamente pnpm 11.
- Una instancia de MySQL accesible.
- Una configuracion de Auth0 para la API y el cliente web.

El proyecto usa TypeScript en ambos paquetes. El backend se ejecuta en desarrollo con `tsx`.

## Instalacion local

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd HomeFix
```

### 2. Configurar el backend

```bash
cd server
pnpm install
```

Crear `server/.env` sin subirlo al repositorio.

Variables obligatorias para iniciar el backend:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com/
GEMINI_API_KEY=your-gemini-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

Variables necesarias para los flujos de autenticacion con usuario y contrasena:

```env
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_DB_CONNECTION=Username-Password-Authentication
```

Variables opcionales o dependientes de una funcionalidad:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:5173
API_BASE_URL=https://api.miapinode.com
LOG_LEVEL=debug

# Roles y Management API de Auth0. Necesarios para asignar roles,
# consultar usuarios o enviar verificaciones desde el backend.
AUTH0_M2M_CLIENT_ID=your-m2m-client-id
AUTH0_M2M_CLIENT_SECRET=your-m2m-client-secret
AUTH0_CLIENT_ROLE_ID=your-client-role-id
AUTH0_WORKER_ROLE_ID=your-worker-role-id

# KYC de Didit. Necesarias para iniciar la verificacion automatica.
DIDIT_API_KEY=your-didit-api-key
DIDIT_WORKFLOW_ID=your-didit-workflow-id
DIDIT_BASE_URL=https://verification.didit.me
DIDIT_CALLBACK_URL=https://your-frontend.example/callback
DIDIT_WEBHOOK_SECRET=your-didit-webhook-secret

# Notificaciones de Telegram. Si no se define, Telegram queda deshabilitado.
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

`PORT`, `NODE_ENV`, `GEMINI_MODEL`, `DIDIT_BASE_URL`, `FRONTEND_URL` y `API_BASE_URL` tienen valores predeterminados en el codigo. `CORS_ORIGIN`, Telegram, Didit, los roles y la Management API de Auth0 son opcionales para iniciar el servidor, pero las funciones que los usan requieren su configuracion correspondiente.

### 3. Inicializar Prisma y categorias

Para una base local vacia o una base que ya tiene las migraciones versionadas:

```bash
pnpm run db:setup
```

Este comando ejecuta `prisma migrate deploy` y luego `tsx prisma/seed.ts`. El seed inicializa las categorias faltantes sin borrar cuentas, publicaciones, reseñas ni categorias existentes. Puede repetirse de forma segura.

Si la base ya tiene las migraciones aplicadas y solo falta el catalogo:

```bash
pnpm run db:seed
```

No uses `db:seed:demo` durante una instalacion normal: `prisma/seed-demo.ts` borra datos de aplicacion y recrea datos de demostracion. Debe ejecutarse solamente contra una base descartable.

Para crear una migracion durante el desarrollo de esquema, no durante la instalacion:

```bash
pnpm run db:migrate -- --name describe_your_change
```

### 4. Configurar el frontend

En otra terminal:

```bash
cd client
pnpm install
```

Crear `client/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_AUTH0_DOMAIN=https://your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/auth/callback
```

Las cinco variables `VITE_*` son usadas por el cliente. El dominio, client ID, audience y callback deben coincidir con la aplicacion configurada en Auth0. El flujo de Google usa Authorization Code + PKCE.

## Ejecutar en desarrollo

Desde la raiz, en terminales separadas:

```bash
pnpm dev-be
pnpm dev-fe
```

O desde cada paquete:

```bash
cd server
pnpm run dev
```

```bash
cd client
pnpm run dev
```

El backend queda disponible en `http://localhost:3000` y Vite en `http://localhost:5173`.

## Autenticacion

Auth0 administra las credenciales y emite los tokens. El backend valida los access tokens RS256 mediante `AUTH0_AUDIENCE` y `AUTH0_ISSUER_BASE_URL`. El frontend usa Auth0 para el login social y el backend usa Auth0 Database Connection para registro y login con email y contraseña.

Las contraseñas se gestionan en Auth0 y no se almacenan ni se validan con un mecanismo propio de HomeFix.

## Scripts principales

### Raiz

| Comando | Descripcion |
|---|---|
| `pnpm dev-fe` | Inicia el frontend con Vite |
| `pnpm dev-be` | Inicia el backend con `tsx watch` |
| `pnpm build-fe` | Construye el frontend |
| `pnpm build-be` | Construye el backend TypeScript |
| `pnpm lint-fe` | Ejecuta ESLint del frontend |
| `pnpm lint-be` | Ejecuta ESLint del backend |
| `pnpm test` | Ejecuta las pruebas del backend |

### Backend (`server/`)

| Comando | Descripcion |
|---|---|
| `pnpm run dev` | Desarrollo con `tsx watch src/index.ts` |
| `pnpm run build` | Compila TypeScript a `dist/` |
| `pnpm start` | Ejecuta `dist/index.js` |
| `pnpm run typecheck` | Verifica tipos sin emitir archivos |
| `pnpm run db:setup` | Aplica migraciones existentes e inicializa categorias |
| `pnpm run db:seed` | Agrega categorias faltantes sin borrar datos |
| `pnpm run db:seed:demo` | Borra datos y crea una demo descartable |
| `pnpm test` | Ejecuta Vitest |

### Frontend (`client/`)

| Comando | Descripcion |
|---|---|
| `pnpm run dev` | Desarrollo con Vite y HMR |
| `pnpm run build` | Ejecuta `tsc -b` y construye para produccion |
| `pnpm run typecheck` | Verifica TypeScript |
| `pnpm run lint` | Ejecuta ESLint |
| `pnpm run test` | Ejecuta Vitest |
| `pnpm run preview` | Sirve localmente el build generado |

## Pruebas y CI

CI usa Node.js 22 y pnpm 11. Instala ambos paquetes con `pnpm install --frozen-lockfile`, ejecuta lint y build, y ejecuta las pruebas del backend contra una instancia MySQL de prueba. La migracion de prueba usa `db:migrate:test` sobre esa base descartable y acepta perdida de datos; no debe ejecutarse contra una base de desarrollo o produccion.

La guia documenta desarrollo local y pruebas. No asume un procedimiento de despliegue que no este definido en estos archivos.
