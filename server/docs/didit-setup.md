# Didit KYC — Setup local

Guía para configurar la verificación de identidad con [Didit](https://docs.didit.me) en entorno local.

> Estado actual: **Iframe SDK embebido**. El usuario completa la verificación dentro de la app sin salir de la página. El status se guarda en la DB y se actualiza vía SDK callback (frontend) + polling (cada 10s) + webhook (backup en producción).

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
# Didit KYC (las 3 vars son compartidas — pedilas al team lead)
DIDIT_API_KEY=<api-key-compartida>
DIDIT_WORKFLOW_ID=<uuid-del-workflow>
DIDIT_WEBHOOK_SECRET=<secret-shared-key-del-webhook>
```

> Las 3 variables de Didit son las mismas para todos los developers. No las generes — pedilas al team lead.

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
4. Click en **Iniciar verificación** → se abre un **modal embebido** dentro de la app con el flow de Didit.
5. Completar el flow (DNI frente/dorso + selfie) dentro del modal.
6. Al terminar, el SDK de Didit recibe el resultado via `postMessage` y la app muestra el estado final.

> No se redirige a ninguna URL externa. Todo ocurre dentro de un iframe embebido en la app.

### Status posibles

| Status | Significado | UI en HomeFix |
|---|---|---|
| `Approved` | Verificación aprobada | "Identidad validada" |
| `In Review` | Requiere revisión manual | "Verificación en revisión" |
| `Declined` | Rechazada | "No pudimos validar tu identidad" |
| `Expired` | Sesión expirada | "La verificación expiró" |
| `Abandoned` | User no completó | "Verificación incompleta" |
| otros | Cualquier otro | Copy default: "Verificación recibida" |

### Polling automático

Si el status queda en `IN_REVIEW` (o cualquier otro estado no-`NOT_STARTED`), la app consulta automáticamente la API de Didit cada 10 segundos para detectar cambios. Si cambias el status desde el dashboard de Didit, la app lo refleja sin necesidad de refrescar.

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

## 6. Limitaciones conocidas

- **Webhook sin URL pública**: en desarrollo no se puede recibir webhooks de Didit. El polling cada 10s cubre esta necesidad. Para staging/producción, configurar una URL pública en Didit dashboard.
- **Polling en status terminales**: cuando un usuario está en `/kyc` con status APPROVED/DECLINED/EXPIRED, cada request a `/kyc/status` consulta la API de Didit. Si muchos usuarios están en la página simultáneamente, puede acercarse a los rate limits de Didit. Optimización futura: solo polling una vez después del confirm, no continuo.
- **API key compartida**: todos los workers usan el mismo workflow. No hay segregación por tenant.
- **Email stub**: las notificaciones por email son `console.log` — falta integrar un proveedor real (SendGrid, SES).
- **`getSessionStatus` 404**: el endpoint GET `/v3/session/{id}/` de Didit devuelve 404 consistentemente. Usamos `getDecision` (GET `/v3/session/{id}/decision/`) como endpoint primario. Si Didit cambia esto, podría requerir ajustes.
