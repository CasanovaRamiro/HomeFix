# HomeFix - Server

API REST de HomeFix construida con Node.js, Express 5, TypeScript, Prisma 5.22 y MySQL.

## Requisitos

- Node.js 22.12 o superior.
- pnpm 11.
- MySQL accesible mediante `DATABASE_URL`.
- Auth0 para validar tokens y para los flujos de registro y login.

CI usa Node.js 22 y pnpm 11. El servidor es un proyecto ESM de TypeScript y se ejecuta en desarrollo con `tsx`.

## Instalacion

```bash
cd server
pnpm install
```

Crear `.env` en este directorio. El backend exige estas variables al iniciar:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com/
GEMINI_API_KEY=your-gemini-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

Para registro y login con email y contraseña también se necesitan:

```env
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_DB_CONNECTION=Username-Password-Authentication
```

Variables opcionales o específicas de funcionalidades:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:5173
API_BASE_URL=https://api.miapinode.com
LOG_LEVEL=debug
AUTH0_M2M_CLIENT_ID=your-m2m-client-id
AUTH0_M2M_CLIENT_SECRET=your-m2m-client-secret
AUTH0_CLIENT_ROLE_ID=your-client-role-id
AUTH0_WORKER_ROLE_ID=your-worker-role-id
DIDIT_API_KEY=your-didit-api-key
DIDIT_WORKFLOW_ID=your-didit-workflow-id
DIDIT_BASE_URL=https://verification.didit.me
DIDIT_CALLBACK_URL=https://your-frontend.example/callback
DIDIT_WEBHOOK_SECRET=your-didit-webhook-secret
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

Las variables de Management API de Auth0 se requieren para operaciones como asignar roles, consultar usuarios o enviar verificaciones. Las variables de Didit se requieren para KYC automatico. Si no se define `TELEGRAM_BOT_TOKEN`, las notificaciones de Telegram quedan deshabilitadas. Los valores predeterminados de `PORT`, `NODE_ENV`, `GEMINI_MODEL`, `DIDIT_BASE_URL`, `FRONTEND_URL` y `API_BASE_URL` estan definidos en `src/lib/envConfig.ts`.

## Prisma y catalogo de categorias

Para aplicar las migraciones existentes y cargar las categorias faltantes:

```bash
pnpm run db:setup
```

`db:setup` ejecuta `prisma migrate deploy` y `tsx prisma/seed.ts`. El seed usa un catalogo idempotente: conserva los datos existentes y no reemplaza IDs de categorias existentes.

Si la base ya esta migrada:

```bash
pnpm run db:seed
```

Este comando solo agrega categorias faltantes. No ejecutar `db:seed:demo` como parte de la instalacion: elimina datos de aplicacion y crea registros de demostracion. Usarlo unicamente con una base descartable.

Para crear una migracion durante el desarrollo del esquema:

```bash
pnpm run db:migrate -- --name describe_your_change
```

No usar `db:migrate:test` contra una base normal: el script apunta a `ofix_test` y ejecuta Prisma con `--accept-data-loss` para el entorno de pruebas.

## Desarrollo y produccion

```bash
pnpm run dev
```

El comando usa `tsx watch src/index.ts` y expone la API en el puerto `3000` por defecto.

Para compilar y ejecutar el servidor compilado:

```bash
pnpm run build
pnpm start
```

`build` ejecuta TypeScript con `tsconfig.build.json` y genera `dist/`. `start` ejecuta `dist/index.js`.

## Autenticacion

Auth0 es la autoridad de identidad. El middleware valida access tokens RS256 con `AUTH0_AUDIENCE` y `AUTH0_ISSUER_BASE_URL`. Los endpoints de registro y login delegan las credenciales en Auth0 Database Connection; HomeFix conserva el perfil y las relaciones de la aplicacion en MySQL.

Los endpoints protegidos requieren `Authorization: Bearer <access-token>` y las credenciales se gestionan en Auth0.

## Comandos

| Comando | Descripcion |
|---|---|
| `pnpm run dev` | Desarrollo con `tsx watch` |
| `pnpm run build` | Compila TypeScript a `dist/` |
| `pnpm start` | Ejecuta el build compilado |
| `pnpm run typecheck` | Verifica tipos sin emitir archivos |
| `pnpm run lint` | Ejecuta ESLint |
| `pnpm run db:setup` | Aplica migraciones existentes e inicializa categorias |
| `pnpm run db:seed` | Agrega categorias faltantes sin borrar datos |
| `pnpm run db:seed:demo` | Borra datos y crea una demo descartable |
| `pnpm test` | Ejecuta Vitest |
| `pnpm run test:coverage:service` | Pruebas de servicios con cobertura |
| `pnpm run test:coverage:data` | Pruebas de repositories con cobertura |
| `pnpm run test:coverage:routes` | Pruebas de rutas con cobertura |

## Pruebas

En CI, las pruebas usan MySQL 8 en una base `ofix_test`, ejecutan `db:migrate:test` y luego `pnpm test`. Ese flujo es exclusivo de CI/pruebas y acepta perdida de datos en la base de test.

La estructura actual del servidor se encuentra bajo `src/presentation`, `src/domain`, `src/infrastructure` y `src/lib`; la aplicacion se registra desde `src/index.ts`.
