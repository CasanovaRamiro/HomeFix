# Didit KYC — Setup local

Guía para configurar la verificación de identidad con [Didit](https://docs.didit.me) en entorno local.

> Estado actual: **MVP con persistencia y webhook**. El status se guarda en la DB y se actualiza vía confirm-first (frontend) + webhook (backend).

---

## 1. Obtener API key

1. Crear cuenta en https://docs.didit.me.
2. Ir a **API Keys** en el dashboard y generar una key de tipo *Live* o *Sandbox* (recomendamos Sandbox para desarrollo).
3. Copiar la key. **No la commitees** — va en `.env`.

> ⚠️ Las keys de Sandbox consumen créditos igual que las de Live. No abuses en pruebas.

---

## 2. Crear un workflow

El workflow define qué documentos se aceptan, qué checks se corren (liveness, face match, IP analysis) y los metadatos asociados. HomeFix usa un workflow específico para **DNI argentino**.

### Usar el script (recomendado)

```bash
cd server
pnpm didit:create-workflow              # crea el workflow en Didit
pnpm didit:create-workflow --dry-run    # muestra el body sin hacer la llamada
```

El script crea un workflow con esta config:

| Feature | Config |
|---|---|
| `OCR` | `documents_allowed: { ARG: { ID: { enabled: 1, sides: 2 } } }` (solo DNI argentino, ambos lados) |
| `LIVENESS` | `face_liveness_method: PASSIVE` |
| `FACE_MATCH` | — |
| `IP_ANALYSIS` | — |

> **No incluye** `DATABASE_VALIDATION` por costo (confirmado con soporte de Didit). Se puede agregar después si hace falta.

La respuesta de Didit devuelve un `workflow_id` (UUID). Pegarlo en `server/.env` como `DIDIT_WORKFLOW_ID`.

### Crear un workflow distinto (ej: agregar otro país)

Editá `server/scripts/createDiditWorkflow.ts` y modificá el array `FEATURES`. Por ejemplo, para permitir también pasaportes:

```ts
const FEATURES = [
  {
    feature: 'OCR',
    config: {
      documents_allowed: {
        ARG: {
          ID: { enabled: 1, sides: 2 },
          P:  { enabled: 1, sides: 1 },
        },
      },
    },
  },
  // ...
]
```

Códigos de documento válidos: `ID` (national ID / DNI), `P` (passport), `DL` (driver's license), `RP` (residence permit), `HIC` (health insurance), `TC` (tax card), `SSC` (social security). Países en ISO 3166-1 alpha-3 (`ARG`, `BRA`, `USA`, etc).

---

## 3. Variables de entorno

En `server/.env`:

```env
# Didit KYC
DIDIT_API_KEY=<tu-api-key>
DIDIT_WORKFLOW_ID=<uuid-del-workflow>

# Opcional: URL de retorno. Si está configurada, el provider la pasa
# al crear cada session y Didit redirige ahí con ?status=...&verificationSessionId=...
# En desarrollo típicamente apunta al front local.
DIDIT_CALLBACK_URL=http://localhost:5173/kyc

# Webhook (opcional para MVP, requerido para producción)
DIDIT_WEBHOOK_SECRET=<secret-shared-key-del-destination>
```

En `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Editabilidad de workflows

Una vez que un workflow recibe al menos una session, Didit lo marca como `is_editable: false` y no se puede modificar vía PATCH. Si querés cambiar la config (agregar/quitar features, cambiar países), hay que **crear uno nuevo** con el script y actualizar el `DIDIT_WORKFLOW_ID`. Borrá el viejo desde la UI de Didit para mantener limpio el dashboard.

---

## 4. Probar el flow end-to-end

1. Levantar server y client:
   ```bash
   cd server && pnpm dev
   cd client && pnpm dev
   ```
2. Loguearse en la app y entrar al dashboard de worker.
3. Click en **Dni** (fila de "Mis validaciones") → abre `/kyc`.
4. Click en **Iniciar verificación** → redirige a Didit.
5. Completar el flow (DNI frente/dorso + selfie).
6. Didit redirige de vuelta a `/kyc?status=...&verificationSessionId=...` y la app muestra el resultado.

### Status posibles en el callback

Didit appendea `?status=<status>` al callback. Valores relevantes para la UI:

| Status | Significado | UI en HomeFix |
|---|---|---|
| `Approved` | Verificación aprobada | "Identidad validada" |
| `In Review` | Requiere revisión manual | "Verificación en revisión" |
| `Declined` | Rechazada | "No pudimos validar tu identidad" |
| `Expired` | Sesión expirada | "La verificación expiró" |
| `Abandoned` | User no completó | "Verificación incompleta" |
| otros | Cualquier otro | Copy default: "Verificación recibida" |

Lista completa en la [API reference de Didit](https://docs.didit.me/reference/sessions).

---

## 5. Webhook (producción)

El webhook recibe notificaciones en tiempo real cuando el status de una sesión cambia. Es el patrón recomendado por Didit.

### Configurar en Didit

1. Ir a **Business Console → API & Webhooks → Add destination**
2. Ingresar la URL: `https://<tu-dominio>/kyc/webhook`
3. Seleccionar evento: `status.updated`
4. Copiar el `secret_shared_key` → pegarlo en `DIDIT_WEBHOOK_SECRET`

### Verificar firmas

El endpoint `POST /kyc/webhook` verifica la firma HMAC-SHA256 de Didit:

- **Primero**: intenta `X-Signature-V2` (canonical JSON con keys sorteadas)
- **Fallback**: `X-Signature-Simple` (firma sobre `timestamp:session_id:status:webhook_type`)
- **Rechaza**: requests con timestamp mayor a 300 segundos (replay attack)

### Probar localmente

Sin ngrok no se puede recibir webhooks de Didit en local. Opciones:

1. **Try Webhook** (recomendado): en Business Console → API & Webhooks → Try Webhook, enviar payloads de prueba a tu URL de producción.
2. **ngrok** (alternativa): `ngrok http 3000` y configurar la URL pública en Didit.
3. **curl manual**: enviar un request firmado al endpoint para verificar que la verificación HMAC funciona.

### Ejemplo de payload

```json
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

Documentación completa: https://docs.didit.me/integration/webhooks

---

## 6. Limitaciones del MVP

- **Webhook sin ngrok**: no se puede testear localmente sin ngrok. El endpoint funciona en producción.
- **API key compartida**: todos los workers usan el mismo workflow. No hay segregación por tenant.
- **Sin retry manual**: si el webhook falla 2 veces, Didit deja de reintentar. No hay mecanismo de reconciliación (excepto polling manual con `GET /kyc/status`).
