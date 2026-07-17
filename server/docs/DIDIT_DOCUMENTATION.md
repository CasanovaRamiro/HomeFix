# Documentación Completa — Didit KYC en HomeFix

## Índice

1. [Qué es Didit](#1-qué-es-didit)
2. [Arquitectura General](#2-arquitectura-general)
3. [Archivos Clave](#3-archivos-clave)
4. [Variables de Entorno](#4-variables-de-entorno)
5. [Base de Datos — Schema Prisma](#5-base-de-datos--schema-prisma)
6. [Flujo Completo de Verificación](#6-flujo-completo-de-verificación)
7. [API Endpoints (Server)](#7-api-endpoints-server)
8. [Provider — Cliente API de Didit](#8-provider--cliente-api-de-didit)
9. [Servicio KYC — Lógica de Negocio](#9-servicio-kyc--lógica-de-negocio)
10. [Webhook — Verificación de Firmas](#10-webhook--verificación-de-firmas)
11. [Cliente — Modal Embebido (SDK Web)](#11-cliente--modal-embebido-sdk-web)
12. [Cliente — Vista KycVerify](#12-cliente--vista-kycverify)
13. [Cliente — Servicio KYC](#13-cliente--servicio-kyc)
14. [Mapeo de Estados](#14-mapeo-de-estados)
15. [Workflow de Didit](#15-workflow-de-didit)
16. [Seguridad y Rate Limiting](#16-seguridad-y-rate-limiting)
17. [Tests](#17-tests)
18. [Limitaciones Conocidas](#18-limitaciones-conocidas)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Qué es Didit

Didit es un proveedor externo de **verificación de identidad (KYC — Know Your Customer)** que permite validar la identidad de los profesionales (workers) que se registran en HomeFix.

### Qué verifica Didit

| Check | Descripción |
|---|---|
| **OCR** | Lee y extrae datos del documento de identidad (DNI argentino, ambos lados) |
| **Liveness (Passive)** | Verifica que la persona es real mediante análisis pasivo de selfie (sin acción del usuario) |
| **Face Match** | Compara la selfie con la foto del documento para confirmar que son la misma persona |
| **IP Analysis** | Analiza la dirección IP del usuario para detectar inconsistencias geográficas |
| **DATABASE_VALIDATION** | NO está habilitado en HomeFix (por costo, confirmado con soporte de Didit) |

> **Agregar imagen**: Captura de pantalla del dashboard de Didit mostrando los checks habilitados para el workflow "HomeFix KYC - Worker Onboarding".

### Cómo se integra

HomeFix utiliza **iframe embebido** (no redirect). El usuario completa toda la verificación dentro de la aplicación, sin salir de la página. El SDK de Didit (`@didit-protocol/sdk-web`) se incrusta en un modal de React.

---

## 2. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (React + Vite)                       │
│                                                                     │
│  ┌──────────────┐    ┌────────────────────┐    ┌────────────────┐  │
│  │  RegisterWorker│───▶│  KycVerify.tsx     │───▶│ DiditVerification│ │
│  │  (3er paso)   │    │  (polling 10s)     │    │ Modal.tsx      │  │
│  └──────────────┘    └────────────────────┘    │ (SDK embebido) │  │
│                              │                  └────────────────┘  │
│                              ▼                                      │
│                    ┌──────────────────┐                             │
│                    │ services/kyc.ts  │                             │
│                    │ (axios client)   │                             │
│                    └──────────────────┘                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVER (Express + TypeScript)                  │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ kyc.routes.ts    │───▶│ kyc.service.ts   │───▶│didit.provider│ │
│  │ (3 routers)      │    │ (lógica negocio) │    │  (.ts)       │ │
│  └──────────────────┘    └──────────────────┘    └──────┬───────┘ │
│         │                                               │         │
│         │              ┌──────────────────┐              │         │
│         │              │didit-signature.ts│              │         │
│         └─────────────▶│(webhook HMAC)    │              │         │
│                        └──────────────────┘              │         │
│                                                          ▼         │
│                                            ┌─────────────────────┐ │
│                                            │   Didit API         │ │
│                                            │ verification.didit.me│ │
│                                            └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Tres mecanismos de actualización de estado

| Mecanismo | Cuándo se usa | Dónde ocurre |
|---|---|---|
| **SDK Callback (frontend)** | Cuando el usuario completa el flow en el iframe | `DiditVerificationModal` → `postMessage` → `POST /kyc/confirm` |
| **Polling (cada 10s)** | Mientras el usuario está en `/kyc` con status no-terminal | `KycVerify.tsx` → `GET /kyc/status` → servidor consulta Didit |
| **Webhook (producción)** | Cuando Didit detecta cambio de status | `POST /kyc/webhook` → verifica HMAC → actualiza DB |

---

## 3. Archivos Clave

### Server (Backend)

| Archivo | Descripción |
|---|---|
| `server/src/infrastructure/providers/didit.provider.ts` | Cliente HTTP para la API de Didit. Expone `createDiditSession`, `getDecision`, `getSessionStatus` |
| `server/src/infrastructure/webhooks/didit-signature.ts` | Verificación HMAC-SHA256 de firmas de webhooks (V2 canonical JSON + Simple) |
| `server/src/domain/services/kyc.service.ts` | Lógica de negocio: iniciar verificación, confirmar, obtener estado, manejar webhooks, mapear estados |
| `server/src/presentation/routes/kyc.routes.ts` | Rutas Express: `POST /session`, `POST /confirm`, `GET /status`, `GET /decision/:id`, `POST /webhook` |
| `server/src/index.ts` | Montaje de rutas (líneas 108, 113, 114) |
| `server/src/lib/envConfig.ts` | Definición de variables de entorno (líneas 37-41) |
| `server/src/infrastructure/database/user.database.ts` | Función `updateUserKycStatus` para persistir estado en DB (líneas 166-174) |
| `server/scripts/createDiditWorkflow.ts` | Script para crear workflows vía API de Didit |
| `server/prisma/schema.prisma` | Modelo User con campos `kycStatus`, `kycVerifiedAt`, `diditVerificationId` |
| `server/prisma/migrations/20260608190000_rename_kyc_session_to_didit_verification/migration.sql` | Migración que renombra `kycSessionId` → `diditVerificationId` |

### Client (Frontend)

| Archivo | Descripción |
|---|---|
| `client/src/components/DiditVerificationModal.tsx` | Modal embebido que usa `@didit-protocol/sdk-web` para mostrar el iframe de verificación |
| `client/src/views/KycVerify.tsx` | Página de verificación KYC: polling de estado, apertura de modal, pantalla de resultado |
| `client/src/views/RegisterWorker.tsx` | Registro de worker (3er paso: selección de método KYC) |
| `client/src/services/kyc.ts` | Servicio cliente: `startKycVerification`, `confirmKycSession`, `fetchKycStatus`, `getKycDecision` |

### Configuración

| Archivo | Descripción |
|---|---|
| `server/.env.example` | Template de variables de entorno (líneas 16-21) |
| `server/.env` | Variables de entorno reales |
| `server/package.json` | Script npm `didit:create-workflow` (línea 18) |
| `client/package.json` | Dependencia `@didit-protocol/sdk-web: ~0.2.1` (línea 16) |
| `didit-workflow.http` | Archivo HTTP para testing manual de la API |

### Documentación y Tests

| Archivo | Descripción |
|---|---|
| `server/docs/didit-setup.md` | Guía de setup local |
| `server/test/providers/didit.provider.test.ts` | Tests unitarios del provider (417 líneas) |
| `server/test/service/kyc.service.test.ts` | Tests unitarios del servicio (614 líneas) |
| `server/test/routes/kyc.test.ts` | Tests de integración de rutas (451 líneas) |
| `client/src/services/kyc.test.ts` | Tests del servicio cliente (78 líneas) |
| `client/src/views/KycVerify.test.tsx` | Tests de la vista (236 líneas) |

> **Agregar imagen**: Estructura de directorios del proyecto resaltando los archivos relacionados con Didit.

---

## 4. Variables de Entorno

### Server (`server/.env`)

```env
# Didit KYC (las 3 vars son compartidas — pedilas al team lead)
DIDIT_API_KEY=<api-key-compartida>
DIDIT_WORKFLOW_ID=<uuid-del-workflow>
DIDIT_WEBHOOK_SECRET=<secret-shared-key-del-webhook>

# Opcional (tiene default)
DIDIT_BASE_URL=https://verification.didit.me
DIDIT_CALLBACK_URL=<redirect-url-opcional>
```

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `DIDIT_API_KEY` | Sí | — | API key del dashboard de Didit (Sandbox o Live) |
| `DIDIT_WORKFLOW_ID` | Sí | — | UUID del workflow creado vía script o dashboard |
| `DIDIT_WEBHOOK_SECRET` | Sí (webhooks) | — | Secret compartido para verificar firmas HMAC de webhooks |
| `DIDIT_BASE_URL` | No | `https://verification.didit.me` | URL base de la API de Didit |
| `DIDIT_CALLBACK_URL` | No | — | URL de redirección post-verificación (no usada en flow embebido) |

> Las 3 variables principales (`DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_WEBHOOK_SECRET**) son las mismas para todos los developers. No las generes — pedilas al team lead.

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 5. Base de Datos — Schema Prisma

En `server/prisma/schema.prisma`, el modelo `User` tiene 3 campos relacionados con KYC:

```prisma
model User {
  // ... otros campos ...
  
  kycStatus          String    @default("NOT_STARTED")
  kycVerifiedAt      DateTime?
  diditVerificationId String?
  
  // ... otros campos ...
}
```

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `kycStatus` | `String` | `"NOT_STARTED"` | Estado actual de la verificación KYC |
| `kycVerifiedAt` | `DateTime?` | `null` | Timestamp de cuándo se resolvió la verificación (terminal status) |
| `diditVerificationId` | `String?` | `null` | ID de sesión de Didit asociada a la verificación |

### Migración relevante

```sql
-- 20260608190000_rename_kyc_session_to_didit_verification
ALTER TABLE "users" RENAME COLUMN "kycSessionId" TO "diditVerificationId";
```

---

## 6. Flujo Completo de Verificación

### Paso 1: Registro del Worker

1. El worker completa el formulario de registro en `RegisterWorker.tsx` (3 pasos: info personal, categorías, método KYC).
2. Si elige método **"automático"**, después del registro la app hace login automático y abre el modal de Didit.

> **Agregar imagen**: Captura del paso 3 del formulario de registro mostrando la selección de método KYC.

### Paso 2: Iniciar Verificación

1. El usuario hace click en "Iniciar verificación" en `/kyc`.
2. El cliente llama `POST /kyc/session` → `startKycVerification(email)`.
3. El servidor:
   - Busca el usuario por email en la DB
   - Verifica que no esté `APPROVED` (409) ni `IN_REVIEW` (409)
   - Llama a `createDiditSession(email)` → `POST https://verification.didit.me/v3/session/`
   - Retorna `{ sessionUrl, sessionId }` al cliente

**Body enviado a Didit:**
```json
{
  "workflow_id": "<DIDIT_WORKFLOW_ID>",
  "vendor_data": "worker@email.com",
  "expected_details": { "id_country": "ARG" }
}
```

> **Agregar imagen**: Diagrama de secuencia del Paso 2 (iniciar verificación).

### Paso 3: Verificación Embebida (iframe)

1. El componente `DiditVerificationModal` usa `@didit-protocol/sdk-web` para embeber el flow en un iframe.
2. El usuario:
   - Sube foto del DNI (frente y dorso)
   - Toma una selfie (liveness pasivo)
3. El SDK envía eventos `postMessage` al componente React:
   - `onEvent`: captura `sessionId` y `status` intermedios
   - `onComplete`: cuando termina (completed, cancelled, failed)
4. Al completar, el modal llama `onComplete(sessionId, status)`.

> **Agregar imagen**: Captura del modal de verificación de Didit embebido en HomeFix mostrando el paso de selfie.

### Paso 4: Confirmación

1. El cliente llama `POST /kyc/confirm` con `{ sessionId, email, sdkStatus }`.
2. El servidor:
   - Intenta `getDecision(sessionId)` → `GET /v3/session/{id}/decision/`
   - Si falla, usa `sdkStatus` o `getSessionStatus(sessionId)` como fallback
   - Mapea el estado de Didit al interno vía `mapDiditStatus()`
   - Actualiza la DB con `kycStatus`, `kycVerifiedAt` (si es terminal), `diditVerificationId`
3. Retorna `{ status, sessionId }` al cliente.

### Paso 5: Polling Automático

1. Mientras el usuario está en `/kyc`, `KycVerify.tsx` ejecuta un `setInterval` cada 10 segundos.
2. Llama `GET /kyc/status` → servidor verifica contra Didit si el status es no-terminal.
3. Si el status cambió, actualiza la DB y retorna el nuevo estado.
4. La UI se actualiza automáticamente.

### Paso 6: Webhook (Producción)

1. Didit envía `POST /kyc/webhook` cuando el status de una sesión cambia.
2. El servidor verifica la firma HMAC-SHA256 (V2 o Simple).
3. Si la firma es válida y el status cambió, actualiza la DB.
4. Si el status es notificable (`APPROVED` o `DECLINED`), envía email (actualmente stub — `console.log`).

> **Agregar imagen**: Diagrama de secuencia completo mostrando los 3 mecanismos de actualización (SDK callback, polling, webhook).

---

## 7. API Endpoints (Server)

### Montaje de Rutas (`server/src/index.ts`)

```typescript
app.use('/kyc', webhookRouter)       // Sin auth — webhook de Didit
app.use('/kyc', confirmRouter)       // Sin auth — rate limited
app.use('/kyc', jwtCheck, kycRoutes) // JWT auth requerido
```

### Endpoints

| Método | Ruta | Auth | Rate Limit | Descripción |
|---|---|---|---|---|
| `POST` | `/kyc/session` | JWT | No | Crea una sesión de verificación Didit, retorna `sessionUrl` y `sessionId` |
| `POST` | `/kyc/confirm` | No | 10 req/min por IP | Confirma una sesión, verifica contra Didit, actualiza DB |
| `GET` | `/kyc/status` | JWT | No | Retorna el estado KYC actual del usuario, consulta Didit si es no-terminal |
| `GET` | `/kyc/decision/:sessionId` | JWT | No | Retorna la decisión completa de Didit (ID verification, liveness, face match, AML) |
| `POST` | `/kyc/webhook` | HMAC signature | No | Recibe notificaciones de Didit (solo `status.updated`) |

### Detalle de Request/Response

#### `POST /kyc/session`

**Request:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json

(sin body)
```

**Response 200:**
```json
{
  "sessionUrl": "https://verification.didit.me/session/...",
  "sessionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}
```

**Response 409:**
```json
{
  "error": "Ya tenés la verificación aprobada"
}
```

#### `POST /kyc/confirm`

**Request:**
```http
Content-Type: application/json

{
  "sessionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "email": "worker@email.com",
  "status": "Approved"
}
```

**Response 200:**
```json
{
  "status": "APPROVED",
  "sessionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}
```

#### `GET /kyc/status`

**Request:**
```http
Authorization: Bearer <jwt-token>
```

**Response 200:**
```json
{
  "kycStatus": "APPROVED",
  "kycVerifiedAt": "2026-07-09T15:30:00.000Z",
  "diditVerificationId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}
```

#### `GET /kyc/decision/:sessionId`

**Request:**
```http
Authorization: Bearer <jwt-token>
```

**Response 200:**
```json
{
  "sessionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "status": "APPROVED",
  "sessionKind": "user",
  "vendorData": "worker@email.com",
  "idVerifications": [{ "...": "..." }],
  "livenessChecks": [{ "...": "..." }],
  "faceMatches": [{ "...": "..." }],
  "amlScreenings": []
}
```

#### `POST /kyc/webhook`

**Request:**
```http
Content-Type: application/json
X-Signature-V2: <hmac-signature>
X-Timestamp: 1774970000

{
  "event_id": "9c0c8b8a-...",
  "webhook_type": "status.updated",
  "session_id": "aaaaaaaa-...",
  "status": "Approved",
  "vendor_data": "user@example.com",
  "timestamp": 1774970000,
  "decision": { "...": "..." }
}
```

**Response 200:**
```json
{
  "ok": true,
  "processed": true
}
```

> **Agregar imagen**: Captura de Swagger/Postman mostrando los endpoints de KYC.

---

## 8. Provider — Cliente API de Didit

**Archivo:** `server/src/infrastructure/providers/didit.provider.ts`

El provider expone 3 funciones que encapsulan las llamadas HTTP a la API de Didit:

### `createDiditSession(vendorData: string)`

```typescript
POST /v3/session/
Body: {
  workflow_id: DIDIT_WORKFLOW_ID,
  vendor_data: vendorData,        // email del usuario
  expected_details: { id_country: 'ARG' }
}
Headers: { 'x-api-key': DIDIT_API_KEY }
```

**Retorna:** `{ sessionUrl: string, sessionId: string }`

- Timeout: 10 segundos (AbortController)
- Valida que la respuesta tenga `url` y `session_id`

### `getDecision(sessionId: string)`

```typescript
GET /v3/session/{sessionId}/decision/
Headers: { 'x-api-key': DIDIT_API_KEY }
```

**Retorna:**
```typescript
{
  sessionId: string
  status: string
  sessionKind: string
  vendorData: string | null
  idVerifications: unknown[]
  livenessChecks: unknown[]
  faceMatches: unknown[]
  amlScreenings: unknown[]
}
```

- Endpoint principal para obtener el estado de la verificación
- Retorna 404 si la sesión no existe

### `getSessionStatus(sessionId: string)`

```typescript
GET /v3/session/{sessionId}/
Headers: { 'x-api-key': DIDIT_API_KEY }
```

**Retorna:** `{ sessionId: string, status: string, url: string }`

- Usado como fallback cuando `getDecision` falla
- **Known issue:** Este endpoint devuelve 404 consistentemente en algunos casos

### Manejo de errores

Todas las funciones:
- Usan `AbortController` con timeout de 10 segundos
- Mapean errores HTTP a mensajes amigables en español
- Logging detallado vía `logger` con `action` tag para debugging

---

## 9. Servicio KYC — Lógica de Negocio

**Archivo:** `server/src/domain/services/kyc.service.ts`

### Funciones exportadas

| Función | Descripción |
|---|---|
| `startKycVerification(email)` | Inicia una verificación: busca usuario, valida estado, crea sesión Didit |
| `confirmKyc(email, sessionId, sdkStatus?)` | Confirma una sesión: obtiene decisión de Didit, mapea estado, actualiza DB |
| `getKycStatus(email)` | Retorna estado KYC actual, consulta Didit si es no-terminal |
| `getKycDecision(sessionId)` | Retorna decisión completa de Didit para una sesión |
| `handleKycWebhook(payload)` | Procesa webhook de Didit: valida tipo, mapea estado, actualiza DB, notifica |

### Guard Rails

| Regla | Código | HTTP |
|---|---|---|
| Usuario debe existir | `if (!user)` | 404 |
| No iniciar si ya está APPROVED | `if (user.kycStatus === 'APPROVED')` | 409 |
| No iniciar si ya está IN_REVIEW | `if (user.kycStatus === 'IN_REVIEW')` | 409 |
| Webhook solo procesa `status.updated` | `if (payload.webhook_type !== 'status.updated')` | — |
| Webhook requiere `vendor_data` | `if (!email)` | — |
| Webhook idempotente | `if (user.kycStatus === mappedStatus)` | — |

### Lógica de confirmación con fallback

```
1. Intentar getDecision(sessionId)
   ├─ Éxito → usar decision.status
   └─ Error →
       ├─ Si hay sdkStatus → usar sdkStatus
       └─ Si no hay sdkStatus →
           ├─ Intentar getSessionStatus(sessionId)
           │   ├─ Éxito → usar session.status
           │   └─ Error → lanzar error
           └─ Lanzar error
```

---

## 10. Webhook — Verificación de Firmas

**Archivo:** `server/src/infrastructure/webhooks/didit-signature.ts`

El endpoint de webhook verifica la firma HMAC-SHA256 de Didit para asegurar que las peticiones son auténticas.

### Dos métodos de verificación

#### 1. `verifySignatureV2` (canonical JSON)

```typescript
// 1. Ordenar recursivamente todas las keys del body
// 2. Truncar floats que terminan en .0
// 3. Serializar a JSON canónico
// 4. HMAC-SHA256(secret, canonicalJson)
// 5. Comparar con timingSafeEqual
```

**Headers requeridos:**
- `X-Signature-V2`: firma HMAC
- `X-Timestamp`: timestamp unix en segundos

#### 2. `verifySignatureSimple` (colon-separated)

```typescript
// 1. Construir string: "timestamp:session_id:status:webhook_type"
// 2. HMAC-SHA256(secret, string)
// 3. Comparar con timingSafeEqual
```

**Headers requeridos:**
- `X-Signature-Simple`: firma HMAC
- `X-Timestamp`: timestamp unix en segundos

### Protección contra replay attacks

```typescript
const now = Math.floor(Date.now() / 1000)
if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false
```

Rechaza requests con timestamp mayor a **300 segundos** (5 minutos) de diferencia con el tiempo actual.

### Seguridad adicional

- Usa `crypto.timingSafeEqual` para comparación constante en tiempo (previene timing attacks)
- Logging de firmas inválidas para debugging

> **Agregar imagen**: Diagrama del flujo de verificación de firma HMAC.

---

## 11. Cliente — Modal Embebido (SDK Web)

**Archivo:** `client/src/components/DiditVerificationModal.tsx`

### Dependencia

```json
"@didit-protocol/sdk-web": "~0.2.1"
```

### Props

```typescript
interface DiditVerificationModalProps {
  sessionUrl: string      // URL de la sesión de Didit
  isOpen: boolean         // Controla visibilidad del modal
  onClose: () => void    // Callback al cerrar
  onComplete: (sessionId: string, status: string) => void  // Al completar verificación
  onCancelled: () => void  // Al cancelar
  onFailed: (error: VerificationError) => void  // Al fallar
}
```

### Configuración del SDK

```typescript
DiditSdk.shared.startVerification({
  url: sessionUrl,
  configuration: {
    embedded: true,                    // Modo iframe embebido
    embeddedContainerId: 'didit-embedded-container',  // ID del div contenedor
    loggingEnabled: import.meta.env.DEV,  // Logs solo en desarrollo
    showCloseButton: false,            // Botón de cerrar custom
    showExitConfirmation: true,        // Confirmación al salir
    closeModalOnComplete: false,       // No cerrar auto (maneja React)
  },
})
```

### Eventos del SDK

| Evento | Handler | Descripción |
|---|---|---|
| `onComplete` | `result.type === 'completed'` | Verificación completada exitosamente |
| `onComplete` | `result.type === 'cancelled'` | Usuario canceló la verificación |
| `onComplete` | `result.type === 'failed'` | Error durante la verificación |
| `onStateChange` | `state` | Cambio de estado del SDK (idle, loading, etc.) |
| `onEvent` | `event` | Eventos intermedios (captura sessionId y status) |

### UI del Modal

- Header con logo de HomeFix y título "Verificación de identidad"
- Botón de cerrar (X) con hover effect
- Contenedor para el iframe de Didit
- Soporte para cerrar con tecla Escape
- Overlay con fondo semi-transparente
- Click fuera del modal cierra (si `showExitConfirmation` está activo)

> **Agregar imagen**: Captura del modal de Didit mostrando el header con branding de HomeFix.

---

## 12. Cliente — Vista KycVerify

**Archivo:** `client/src/views/KycVerify.tsx`

### Estados de la vista

| Estado | Descripción |
|---|---|
| `idle` | Estado inicial, listo para iniciar verificación |
| `loading` | Cargando (iniciando sesión de verificación) |
| `error` | Error durante el proceso |

### Copys por estado de verificación

| Status Didit | Título | Descripción | Tono |
|---|---|---|---|
| `Approved` | "Identidad validada" | "Tu verificación fue aprobada. Ya podés empezar a recibir trabajos." | success (verde) |
| `In Review` | "Verificación en revisión" | "Tu validación está siendo revisada. Te avisaremos por mail cuando se confirme." | review (amber) |
| `Declined` | "No pudimos validar tu identidad" | "Podés volver a intentarlo desde el botón de abajo." | declined (rojo) |
| `Expired` | "La verificación expiró" | "Volvé a iniciar el proceso para validarte cuando quieras." | unknown (gris) |
| `Abandoned` | "Verificación incompleta" | "No completaste el proceso. Retomalo cuando quieras desde el botón de abajo." | unknown (gris) |
| `NOT_STARTED` | "Verificación pendiente" | "Aún no iniciaste la verificación de identidad." | unknown (gris) |
| Otro | "Verificación recibida" | "Estamos procesando tu validación." | unknown (gris) |

### Lógica de polling

```typescript
useEffect(() => {
  if (!currentStatus || currentStatus === 'NOT_STARTED') return

  const interval = setInterval(() => {
    fetchKycStatus().then((res) => {
      if (res.kycStatus !== currentStatus) {
        setCurrentStatus(res.kycStatus)  // Actualiza UI automáticamente
      }
    })
  }, 10_000)  // Cada 10 segundos

  return () => clearInterval(interval)
}, [currentStatus])
```

### Botones de retry

Solo disponibles cuando el status es `DECLINED` o `EXPIRED`.

> **Agregar imagen**: Captura de la pantalla de estado "Identidad validada" con el badge verde.

---

## 13. Cliente — Servicio KYC

**Archivo:** `client/src/services/kyc.ts`

### Funciones

```typescript
// Crear sesión de verificación
startKycVerification(): Promise<KycSessionResponse>
// POST /kyc/session

// Confirmar sesión
confirmKycSession(sessionId, email, sdkStatus?): Promise<KycConfirmResponse>
// POST /kyc/confirm

// Obtener estado actual
fetchKycStatus(): Promise<KycStatusResponse>
// GET /kyc/status

// Obtener decisión completa
getKycDecision(sessionId): Promise<KycDecision>
// GET /kyc/decision/:sessionId
```

### Tipos exportados

```typescript
type KycStatus = 'NOT_STARTED' | 'IN_REVIEW' | 'APPROVED' | 'DECLINED' | 'EXPIRED'

interface KycSessionResponse { sessionUrl: string; sessionId: string }
interface KycConfirmResponse { status: string; sessionId: string }
interface KycStatusResponse { kycStatus: KycStatus; kycVerifiedAt: string | null; diditVerificationId: string | null }
interface KycDecision { sessionId: string; status: KycStatus; /* ... */ }
```

---

## 14. Mapeo de Estados

### Didit → HomeFix

| Estado de Didit | Estado interno | Descripción |
|---|---|---|
| `Approved` | `APPROVED` | Verificación aprobada |
| `Declined` | `DECLINED` | Verificación rechazada |
| `Expired` | `EXPIRED` | Sesión expirada |
| `Abandoned` | `EXPIRED` | Usuario abandonó el flow |
| `Kyc Expired` | `EXPIRED` | KYC expirado |
| `In Review` | `IN_REVIEW` | En revisión manual |
| `Resubmitted` | `IN_REVIEW` | Reenviado (vuelve a revisión) |
| `Awaiting User` | `IN_REVIEW` | Esperando acción del usuario |
| `In Progress` | `IN_REVIEW` | En progreso |
| `Not Started` | `NOT_STARTED` | No iniciado |
| `Not Finished` | `IN_REVIEW` | No finalizado |
| (cualquier otro) | `IN_REVIEW` | Estado desconocido → revisión |

### Estados terminales vs no-terminales

| Tipo | Estados | Acción |
|---|---|---|
| **Terminal** | `APPROVED`, `DECLINED`, `EXPIRED` | Se guarda `kycVerifiedAt` con timestamp actual |
| **No-terminal** | `NOT_STARTED`, `IN_REVIEW` | `kycVerifiedAt` se establece en `null` |

### Labels en español

```typescript
const KYC_STATUS_LABELS = {
  NOT_STARTED: 'no iniciada',
  IN_REVIEW: 'en revisión',
  APPROVED: 'aprobada',
  DECLINED: 'rechazada',
  EXPIRED: 'expirada',
}
```

---

## 15. Workflow de Didit

### Crear workflow

```bash
cd server
pnpm didit:create-workflow              # crea el workflow en Didit
pnpm didit:create-workflow --dry-run    # muestra el body sin hacer la llamada
```

### Configuración del workflow

| Feature | Configuración |
|---|---|
| **OCR** | `documents_allowed: { ARG: { ID: { enabled: 1, sides: 2 } } }` — Solo DNI argentino, ambos lados |
| **LIVENESS** | `face_liveness_method: PASSIVE` — Liveness pasivo (sin acción del usuario) |
| **FACE_MATCH** | Habilitado (compara selfie vs foto del documento) |
| **IP_ANALYSIS** | Habilitado |
| **DATABASE_VALIDATION** | NO habilitado (por costo) |

**Etiqueta:** "HomeFix KYC - Worker Onboarding"

### Códigos de documento válidos

| Código | Tipo |
|---|---|
| `ID` | Documento nacional (DNI) |
| `P` | Pasaporte |
| `DL` | Licencia de conducir |
| `RP` | Permiso de residencia |
| `HIC` | Seguro de salud |
| `TC` | Tarjeta fiscal |
| `SSC` | Seguridad social |

### Códigos de país (ISO 3166-1 alpha-3)

`ARG`, `BRA`, `USA`, `MEX`, `CHL`, `COL`, etc.

### Editabilidad

Una vez que un workflow recibe al menos una sesión, Didit lo marca como `is_editable: false`. Para cambiar la config hay que **crear uno nuevo** con el script y actualizar `DIDIT_WORKFLOW_ID`.

---

## 16. Seguridad y Rate Limiting

### Rate Limiting

**Endpoint `POST /kyc/confirm`:**
- Ventana: 60 segundos
- Máximo: 10 requests por IP por ventana
- Implementación: `Map<string, { count, resetAt }>` en memoria

```typescript
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
```

### Autenticación

| Endpoint | Método de auth |
|---|---|
| `POST /kyc/session` | JWT (via `jwtCheck` middleware) |
| `GET /kyc/status` | JWT |
| `GET /kyc/decision/:sessionId` | JWT |
| `POST /kyc/confirm` | Ninguno (rate limited) |
| `POST /kyc/webhook` | HMAC-SHA256 signature |

### Protección de API keys

- Las API keys van en `.env` (nunca en código fuente)
- `.env` está en `.gitignore`
- `.env.example` no contiene valores reales
- Las 3 variables de Didit son compartidas entre developers

### Webhook Security

- Verificación HMAC-SHA256 con dos formatos (V2 y Simple)
- Protección contra replay attacks (timestamp max 300s)
- `crypto.timingSafeEqual` para comparación constante en tiempo
- Logging de firmas inválidas

---

## 17. Tests

### Server

| Archivo | Líneas | Descripción |
|---|---|---|
| `server/test/providers/didit.provider.test.ts` | 417 | Tests unitarios del provider: creación de sesión, obtención de decision, manejo de errores |
| `server/test/service/kyc.service.test.ts` | 614 | Tests unitarios del servicio: flujo completo, guard rails, mapeo de estados, webhooks |
| `server/test/routes/kyc.test.ts` | 451 | Tests de integración: endpoints, auth, rate limiting, webhook signature |

### Client

| Archivo | Líneas | Descripción |
|---|---|---|
| `client/src/services/kyc.test.ts` | 78 | Tests del servicio cliente: llamadas HTTP |
| `client/src/views/KycVerify.test.tsx` | 236 | Tests de la vista: polling, modal, estados UI |

### Ejecutar tests

```bash
# Server
cd server && pnpm test

# Client
cd client && pnpm test
```

---

## 18. Limitaciones Conocidas

| Limitación | Descripción | Workaround |
|---|---|---|
| **Webhook sin URL pública** | En desarrollo no se puede recibir webhooks de Didit | Polling cada 10s cubre esta necesidad. Para staging/producción, configurar URL pública |
| **Polling en status terminales** | Si muchos usuarios están en `/kyc` con status no-terminal, puede acercarse a rate limits | Optimización futura: solo polling una vez después del confirm |
| **API key compartida** | Todos los workers usan el mismo workflow | No hay segregación por tenant |
| **Email stub** | Las notificaciones por email son `console.log` | Falta integrar proveedor real (SendGrid, SES) |
| **`getSessionStatus` 404** | El endpoint GET `/v3/session/{id}/` devuelve 404 consistentemente | Usamos `getDecision` como endpoint primario |
| **Workflows no editables** | Después de recibir 1 sesión, Didit bloquea edits | Hay que crear uno nuevo y actualizar `DIDIT_WORKFLOW_ID` |
| **Sandbox consume créditos** | Las keys de Sandbox consumen igual que Live | No abusar en pruebas |

---

## 19. Troubleshooting

### Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `DIDIT_API_KEY is not configured` | Falta variable en `.env` | Agregar `DIDIT_API_KEY` a `server/.env` |
| `DIDIT_WORKFLOW_ID is not configured` | Falta variable en `.env` | Agregar `DIDIT_WORKFLOW_ID` a `server/.env` |
| `No se pudo contactar al servicio de verificación` | Timeout o error de red | Verificar conectividad a `verification.didit.me` |
| `El servicio de verificación rechazó la solicitud` | API key inválida o workflow incorrecto | Verificar API key y workflow ID en dashboard de Didit |
| `La sesión de verificación no existe` | Session ID inválido o sesión expirada | Crear una nueva sesión |
| `Ya tenés la verificación aprobada` | Usuario ya tiene status APPROVED | No se puede re-iniciar si ya está aprobado |
| `Demasiadas solicitudes` | Rate limit en `/kyc/confirm` | Esperar 1 minuto |
| `Invalid signature` (webhook) | Firma HMAC inválida o timestamp expirado | Verificar `DIDIT_WEBHOOK_SECRET` y reloj del servidor |

### Logs útiles

El server usa `pino` logger con `action` tags para filtering:

```bash
# Buscar logs de Didit
grep "didit" server.log

# Buscar errores de KYC
grep "kyc\." server.log

# Buscar webhooks
grep "webhook" server.log
```

### Comandos útiles

```bash
# Crear workflow (dry run)
cd server && pnpm didit:create-workflow --dry-run

# Crear workflow (real)
cd server && pnpm didit:create-workflow

# Verificar variables de entorno
cd server && npx tsx -e "import { env } from './src/lib/envConfig.js'; console.log(env)"

# Testing manual con didit-workflow.http
# Abrir en VS Code con REST Client extension
```

---

## Referencias

- **Documentación de Didit:** https://docs.didit.me
- **API Reference:** https://docs.didit.me/api
- **Webhooks:** https://docs.didit.me/integration/webhooks
- **SDK Web:** https://www.npmjs.com/package/@didit-protocol/sdk-web

---

*Última actualización: Julio 2026*
