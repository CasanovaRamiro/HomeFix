# HomeFix — Manual de Implementación y Despliegue

> **Proyecto:** HomeFix — Plataforma de Conexión entre Clientes y Trabajadores del Hogar  
> **Versión:** 1.0.0  
> **Fecha:** Julio 2026  
> **Documento:** Trabajo Final Integrador (TFI)

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura General](#2-arquitectura-general)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Requisitos de Hardware](#4-requisitos-de-hardware)
5. [Requisitos de Software](#5-requisitos-de-software)
6. [Instalación del Proyecto](#6-instalación-del-proyecto)
7. [Configuración de Variables de Entorno](#7-configuración-de-variables-de-entorno)
8. [Base de Datos](#8-base-de-datos)
9. [Configuración de Servicios Externos](#9-configuración-de-servicios-externos)
10. [Ejecución Local](#10-ejecución-local)
11. [Despliegue](#11-despliegue)
12. [Pruebas de Implementación](#12-pruebas-de-implementación)
13. [Problemas Conocidos](#13-problemas-conocidos)
14. [Mantenimiento](#14-mantenimiento)
15. [Anexos](#15-anexos)

---

## 1. Introducción

### 1.1. ¿Qué es HomeFix?

HomeFix es una aplicación web full-stack diseñada para conectar clientes que necesitan servicios de reparación y mantenimiento del hogar con trabajadores calificados de la zona. La plataforma permite a los clientes publicar sus necesidades y a los trabajadores postularse, ofreciendo un sistema completo de gestión de servicios con verificación de identidad, diagnóstico por inteligencia artificial, sistema de licitaciones y reseñas.

### 1.2. Objetivos

- **Para clientes:** Publicar trabajos, recibir postulaciones, gestionar licitaciones, verificar la identidad de los trabajadores y calificar el servicio recibido.
- **Para trabajadores:** Encontrar trabajos disponibles, postularse, gestionar su agenda, subcontratar otros profesionales y construir su reputación mediante reseñas.

### 1.3. Funcionalidades Principales

| Módulo | Descripción |
|--------|-------------|
| **Autenticación** | Registro e inicio de sesión con email/password o Google (via Auth0) |
| **KYC Biométrico** | Verificación de identidad del trabajador con Didit (OCR + Liveness + Face Match) |
| **Publicaciones** | Creación de solicitudes de trabajo con categorías, fechas, ubicación y fotos |
| **Postulación** | Los trabajadores se postulan a publicaciones con mensaje, disponibilidad y costo de visita |
| **Licitaciones** | Sistema de ofertas competitivas con pesos personalizados |
| **Subcontratos** | Gestión de subcontratos entre trabajadores |
| **Diagnóstico IA** | Análisis de problemas del hogar mediante Google Gemini |
| **Calificaciones** | Sistema de reseñas bidireccional (cliente→trabajador y trabajador→cliente) |
| **Emergencias** | Publicaciones de emergencia con notificaciones push |
| **Bot de Telegram** | Notificaciones y vinculación de cuenta via Telegram |
| **Galería** | Gestión de imágenes de trabajos y perfil via Cloudinary |

### 1.4. Estructura del Documento

El presente documento describe el proceso de implementación y despliegue de HomeFix, incluyendo los requisitos técnicos, instalación de dependencias, configuración de servicios externos y puesta en producción de la aplicación.

> **[IMAGEN SUGERIDA]:** Captura de pantalla de la landing page de HomeFix mostrando la interfaz principal.

---

## 2. Arquitectura General

### 2.1. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Navegador)                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Frontend — React + Vite                          │    │
│  │                                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │   Auth   │  │  Posts   │  │   KYC    │  │    AI    │  ...     │    │
│  │  │(Auth0 PKCE)│ │(CRUD)    │  │ (Didit)  │  │ (Gemini) │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────────┐  │    │
│  │  │              Axios + React Router + Tailwind CSS              │  │    │
│  │  └──────────────────────────────────────────────────────────────┘  │    │
│  └───────────────────────────────────────┬─────────────────────────────┘    │
│                                          │ HTTP/REST                        │
│                                          ▼                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Backend — Node.js + Express                       │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Presentation Layer  │  Domain Layer  │  Infrastructure Layer  │  │  │
│  │  │  (Routes, DTOs)      │  (Services)    │  (DB, Providers)       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Prisma ORM + MySQL                           │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────┬───────────────────────────────┘  │
│                                          │                                  │
│         ┌────────────────────────────────┼────────────────────────┐         │
│         ▼                                ▼                        ▼         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   MySQL    │  │  Auth0     │  │  Didit KYC │  │  Gemini AI │          │
│  │   (BD)     │  │  (Auth)    │  │  (Identidad)│ │  (Diagnóstico)│        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘          │
│                                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                           │
│  │ Cloudinary │  │  Telegram  │  │   Vercel   │                           │
│  │ (Imágenes) │  │   (Bot)    │  │ (Frontend) │                           │
│  └────────────┘  └────────────┘  └────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Arquitectura en Capas (Backend)

El backend sigue una arquitectura de tres capas estricta donde cada archivo pertenece a exactamente una capa:

```
server/src/
├── lib/                        ← Utilidades compartidas (prisma client, env, errors)
├── infrastructure/             ← Todo lo que toca sistemas externos
│   ├── database/               ← Queries de Prisma
│   ├── transformers/           ← Prisma shape → domain type
│   ├── providers/              ← Llamadas raw a APIs externas (Auth0, Gemini, Didit)
│   └── types/                  ← Tipos internos de Prisma
├── domain/
│   ├── types/                  ← Tipos de dominio (objetos Date, shapes limpios)
│   └── services/               ← Lógica de negocio
└── presentation/
    ├── types/                  ← DTOs (dates como ISO strings)
    ├── transformers/           ← domain type → DTO
    ├── middleware/              ← auth0.middleware, error.middleware
    └── routes/                 ← Handlers Express
```

**Reglas de importación (solo hacia abajo):**

| Desde | Puede importar de |
|-------|-------------------|
| `presentation/routes` | `domain/services`, `presentation/transformers`, `presentation/types`, `presentation/middleware`, `lib/` |
| `domain/services` | `infrastructure/database`, `infrastructure/providers`, `domain/types`, `lib/` |
| `infrastructure/database` | `infrastructure/transformers`, `infrastructure/types`, `domain/types`, `lib/` |

### 2.3. Estructura del Monorepo

El proyecto utiliza **pnpm workspaces** para gestionar frontend y backend en un solo repositorio:

```
HomeFix-Nuevo/
├── client/          ← React + Vite (puerto 5173)
├── server/          ← Express + Prisma + MySQL (puerto 3000)
├── package.json     ← Scripts compartidos (dev-fe, dev-be, build-fe, build-be)
├── pnpm-workspace.yaml
└── README.md
```

> **[IMAGEN SUGERIDA]:** Diagrama de la estructura de carpetas del proyecto.

---

## 3. Tecnologías Utilizadas

### 3.1. Stack Tecnológico

| Categoría | Tecnología | Versión | Uso |
|-----------|-----------|---------|-----|
| **Frontend** | React | 19.2.4 | UI Library |
| | Vite | 8.0.4 | Build Tool y Dev Server |
| | TypeScript | 5.8.3 | Type Safety |
| | Tailwind CSS | 4.3.0 | Utility-first CSS |
| | React Router | 7.14.1 | Client-side Routing |
| | Axios | 1.15.1 | HTTP Client |
| | Leaflet | 1.9.4 | Mapas interactivos |
| | Lucide React | 1.16.0 | Iconografía |
| | Vitest | 4.1.4 | Testing Framework |
| | vite-plugin-pwa | 1.3.0 | Progressive Web App |
| **Backend** | Node.js | 22+ | Runtime |
| | Express | 5.2.1 | Web Framework |
| | Prisma | 5.22.0 | ORM |
| | TypeScript | 5.8.3 | Type Safety |
| | tsx | 4.19.3 | TypeScript Execution |
| | pino | 10.3.1 | Logging |
| | Vitest | 4.1.4 | Testing Framework |
| **Base de Datos** | MySQL | 8.x | Database |
| **Auth** | Auth0 | - | Authentication & Authorization |
| **KYC** | Didit | - | Verificación biométrica |
| **IA** | Google Gemini | 2.5-flash | Diagnóstico de problemas |
| **Imágenes** | Cloudinary | 2.10.0 | Image hosting & management |
| **Bot** | Telegraf | 4.16.3 | Telegram Bot |
| **Deploy Frontend** | Vercel | - | Hosting |
| **Deploy Backend** | Railway | - | Hosting + Docker |

### 3.2. Dependencias Principales

**Frontend (`client/package.json`):**
- `@didit-protocol/sdk-web`: SDK para verificación KYC embebida
- `react-leaflet`: Componentes de mapas
- `workbox-window`: Service Worker para PWA
- `@tailwindcss/vite`: Plugin de Tailwind para Vite

**Backend (`server/package.json`):**
- `@google/generative-ai`: Cliente de Google Gemini
- `cloudinary`: SDK de Cloudinary
- `multer`: Manejo de uploads multipart
- `socket.io`: WebSockets (para tiempo real)
- `telegraf`: Framework para bots de Telegram
- `swagger-ui-express`: Documentación API interactiva
- `express-oauth2-jwt-bearer`: Validación JWT de Auth0

---

## 4. Requisitos de Hardware

### 4.1. Desarrollo

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 núcleos | 4 núcleos |
| RAM | 4 GB | 8 GB |
| Almacenamiento | 5 GB libres | 10 GB libres |
| Internet | Estable | Estable (para servicios externos) |

### 4.2. Producción

| Recurso | Especificación |
|---------|---------------|
| Servidor | VPS o Cloud (Railway, AWS, etc.) |
| RAM | 512 MB - 1 GB (dependiendo de tráfico) |
| Almacenamiento | 10 GB (base de datos + logs) |
| Internet | Estable con baja latencia |
| SSL | Requerido (proporcionado por el hosting) |

---

## 5. Requisitos de Software

### 5.1. Desarrollo

| Software | Versión | Propósito |
|----------|---------|-----------|
| **Node.js** | v18 o superior (recomendado: v22) | Runtime de JavaScript |
| **pnpm** | 8+ | Gestor de paquetes (monorepo) |
| **MySQL** | 8.x | Base de datos |
| **Git** | 2.x | Control de versiones |
| **Editor** | VS Code (recomendado) | IDE |
| **Extensión VS Code** | REST Client | Testing manual de endpoints (`.http` files) |

### 5.2. Servicios Externos (Cuentas requeridas)

| Servicio | Propósito | URL |
|----------|-----------|-----|
| **Auth0** | Autenticación y autorización | https://auth0.com |
| **Didit** | Verificación de identidad (KYC) | https://didit.me |
| **Google AI Studio** | API Key de Gemini | https://aistudio.google.com |
| **Cloudinary** | Hosting de imágenes | https://cloudinary.com |
| **Vercel** | Deploy del frontend | https://vercel.com |
| **Railway** | Deploy del backend | https://railway.app |
| **Telegram** | Bot de notificaciones | https://t.me/BotFather |

---

## 6. Instalación del Proyecto

### 6.1. Clonar el Repositorio

```bash
git clone https://github.com/TU-USUARIO/HomeFix-Nuevo.git
cd HomeFix-Nuevo
```

### 6.2. Instalar Dependencias

Desde la raíz del proyecto:

```bash
# Instala dependencias de client/ y server/ en un solo comando
pnpm install
```

**Nota:** pnpm workspaces instalará automáticamente las dependencias de ambas carpetas.

### 6.3. Configurar Base de Datos

1. Asegúrese de tener MySQL ejecutándose en `localhost:3306`

2. Crear la base de datos:
```sql
CREATE DATABASE homefix;
```

3. O usar la base de datos del proyecto:
```sql
CREATE DATABASE ofix_db;
```

### 6.4. Configurar Variables de Entorno

Copiar los archivos de ejemplo y completar con sus credenciales:

```bash
# Backend
cp server/.env.example server/.env

# Frontend
cp client/.env.example client/.env
```

Ver sección [7. Configuración de Variables de Entorno](#7-configuración-de-variables-de-entorno) para el detalle completo.

### 6.5. Ejecutar Migraciones

```bash
cd server
pnpm run db:migrate -- --name init
```

### 6.6. Poblar Base de Datos (Opcional)

```bash
cd server
pnpm run db:seed
```

Esto crea:
- 15 clientes de prueba
- 1 trabajador de prueba
- 8 categorías (Electricidad, Plomería, Carpintería, Pintura, Albañilería, Cerrajería, Aire/HVAC, Electrónica)
- 15 publicaciones distribuidas en AMBA
- 7 postulaciones de ejemplo

---

## 7. Configuración de Variables de Entorno

### 7.1. Frontend (`client/.env`)

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | URL del backend |
| `VITE_AUTH0_DOMAIN` | `https://tu-tenant.us.auth0.com` | Dominio de Auth0 |
| `VITE_AUTH0_CLIENT_ID` | `abc123...` | Client ID de Auth0 |
| `VITE_AUTH0_AUDIENCE` | `https://api.miapinode.com` | Audience de la API |
| `VITE_AUTH0_CALLBACK_URL` | `http://localhost:5173/auth/callback` | URL de callback post-login |

### 7.2. Backend (`server/.env`)

#### Base de Datos
| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `mysql://root:1234@localhost:3306/ofix_db` | URL de conexión a MySQL |
| `PORT` | `3000` | Puerto del servidor |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido para CORS |

#### Auth0
| Variable | Descripción |
|----------|-------------|
| `AUTH0_AUDIENCE` | Audience de la API (ej: `https://api.miapinode.com`) |
| `AUTH0_ISSUER_BASE_URL` | URL base del tenant (ej: `https://tu-tenant.us.auth0.com/`) |
| `AUTH0_CLIENT_ID` | Client ID de la aplicación |
| `AUTH0_M2M_CLIENT_ID` | Client ID para Machine-to-Machine |
| `AUTH0_M2M_CLIENT_SECRET` | Client Secret para M2M |
| `AUTH0_WORKER_ROLE_ID` | ID del rol "Worker" en Auth0 |
| `AUTH0_CLIENT_ROLE_ID` | ID del rol "Client" en Auth0 |

#### Inteligencia Artificial (Gemini)
| Variable | Descripción |
|----------|-------------|
| `GEMINI_API_KEY` | API Key de Google AI Studio |
| `GEMINI_MODEL` | Modelo a usar (default: `gemini-2.5-flash-lite`) |

#### Verificación de Identidad (Didit)
| Variable | Descripción |
|----------|-------------|
| `DIDIT_API_KEY` | API Key del dashboard de Didit |
| `DIDIT_WORKFLOW_ID` | UUID del workflow de verificación |
| `DIDIT_WEBHOOK_SECRET` | Secret para verificar firmas HMAC de webhooks |
| `DIDIT_BASE_URL` | URL base (default: `https://verification.didit.me`) |
| `DIDIT_CALLBACK_URL` | URL de redirección post-verificación |

#### Almacenamiento de Imágenes (Cloudinary)
| Variable | Descripción |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret |

#### Bot de Telegram
| Variable | Descripción |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Token del bot (obtenido via @BotFather) |

> **IMPORTANTE:** Nunca subir archivos `.env` a control de versiones. El archivo `.gitignore` ya lo excluye.

---

## 8. Base de Datos

### 8.1. Diagrama Entidad-Relación (Mermaid)

El siguiente diagrama puede generarse con cualquier herramienta compatible con Mermaid (draw.io, dbdiagram.io, mermaid.live, etc.):

```mermaid
erDiagram
    User {
        uuid id PK
        varchar email UK
        varchar name
        varchar surname
        varchar password
        varchar phone
        text bio
        varchar role
        datetime createdAt
        boolean active
        boolean deleted
        boolean emergenciesEnabled
        boolean requiresStartToken
        varchar photo
        varchar matriculaUrl
        text availability
        varchar telegramChatId UK
        datetime telegramLinkedAt
        varchar nationalId
        varchar nationalIdTypeId FK
        varchar addressId FK
        text certificates
        text gallery
        varchar kycStatus
        datetime kycVerifiedAt
        varchar diditVerificationId
    }

    Post {
        uuid id PK
        varchar userId FK
        varchar type
        varchar parentPostId FK
        varchar subcontractGroupId
        datetime startDate
        datetime endDate
        varchar title
        text description
        varchar address
        varchar status
        float latitude
        float longitude
        boolean isEmergency
        datetime emergencyExpiresAt
        boolean allowsSubcontracting
        boolean isBidding
        text bidWeights
        varchar materialResponsibility
        float budgetMax
        datetime createdAt
        datetime updatedAt
    }

    Category {
        uuid id PK
        varchar name UK
    }

    PostCategory {
        uuid id PK
        varchar postId FK
        varchar categoryId FK
        int quantity
        int filledCount
        text roleDescription
    }

    UserCategory {
        uuid id PK
        varchar userId FK
        varchar categoryId FK
    }

    Application {
        uuid id PK
        varchar workerId FK
        varchar postId FK
        varchar categoryId FK
        varchar subcontractGroupId
        varchar status
        text message
        text availableDays
        varchar availableTimeFrom
        varchar availableTimeTo
        boolean chargesVisit
        float visitCost
        datetime scheduledDate
        int offeredDuration
        boolean requiresStartToken
        varchar startToken
        datetime startTokenExpiresAt
        int startTokenAttempts
        datetime tokenValidatedAt
        datetime createdAt
        datetime updatedAt
    }

    JobApplication {
        uuid id PK
        varchar workerId FK
        varchar postId FK
        varchar status
        datetime createdAt
    }

    WorkerReview {
        uuid id PK
        varchar applicationId FK
        varchar reviewerId FK
        varchar workerId FK
        text description
        int rating
        text mediaUrls
        datetime createdAt
    }

    ClientReview {
        uuid id PK
        varchar applicationId FK
        varchar reviewerId FK
        varchar clientId FK
        text description
        int rating
        datetime createdAt
    }

    PostImage {
        uuid id PK
        varchar url
        varchar postId FK
    }

    NationalIdType {
        uuid id PK
        varchar description
    }

    Address {
        uuid id PK
        varchar street
        varchar number
        varchar city
        varchar state
    }

    TelegramLinkCode {
        uuid id PK
        varchar userId FK
        varchar code UK
        datetime expiresAt
        boolean used
        datetime createdAt
    }

    %% ── RELACIONES ──

    User ||--o{ Post : "crea (1:N)"
    User ||--o{ Application : "se postula (1:N)"
    User ||--o{ JobApplication : "postulación legacy (1:N)"
    User ||--o{ UserCategory : "tiene categorías (1:N)"
    User ||--o{ TelegramLinkCode : "vincula telegram (1:N)"
    User }o--|| Address : "tiene dirección (N:1)"
    User }o--|| NationalIdType : "tipo de documento (N:1)"

    Post ||--o{ PostCategory : "tiene categorías (1:N)"
    Post ||--o{ Application : "recibe postulaciones (1:N)"
    Post ||--o{ JobApplication : "postulación legacy (1:N)"
    Post ||--o{ PostImage : "tiene imágenes (1:N)"
    Post }o--|| User : "pertenece a cliente (N:1)"
    Post }o--o| Post : "sub-posts / subcontratos (N:1)"

    Category ||--o{ PostCategory : "asignada a posts (1:N)"
    Category ||--o{ UserCategory : "asignada a usuarios (1:N)"

    PostCategory ||--o{ Application : "postulación por categoría (1:N)"
    PostCategory }o--|| Post : "pertece a post (N:1)"
    PostCategory }o--|| Category : "es categoría (N:1)"

    UserCategory }o--|| User : "es de usuario (N:1)"
    UserCategory }o--|| Category : "es categoría (N:1)"

    Application ||--o| WorkerReview : "tiene reseña trabajador (1:0..1)"
    Application ||--o| ClientReview : "tiene reseña cliente (1:0..1)"
    Application }o--|| User : "es de trabajador (N:1)"
    Application }o--|| Post : "es de publicación (N:1)"
    Application }o--o| PostCategory : "opcional por categoría (N:0..1)"

    WorkerReview }o--|| Application : "asociada a postulación (1:1)"
    WorkerReview }o--|| User : "reviewer (N:1)"
    WorkerReview }o--|| User : "worker (N:1)"

    ClientReview }o--|| Application : "asociada a postulación (1:1)"
    ClientReview }o--|| User : "reviewer (N:1)"
    ClientReview }o--|| User : "client (N:1)"

    PostImage }o--|| Post : "imagen de post (N:1)"
    TelegramLinkCode }o--|| User : "código de usuario (N:1)"
```

### 8.2. Descripción de Cardinalidades

| Relación | Tipo | Descripción |
|----------|------|-------------|
| User → Post | 1:N | Un cliente crea muchas publicaciones |
| User → Application | 1:N | Un trabajador se postula a muchas publicaciones |
| User → UserCategory | 1:N | Un trabajador tiene muchas categorías |
| User → TelegramLinkCode | 1:N | Un usuario genera muchos códigos de vinculación |
| User → Address | N:1 | Muchos usuarios comparten una dirección (ej: mismo edificio) |
| User → NationalIdType | N:1 | Muchos usuarios tienen el mismo tipo de documento |
| Post → PostCategory | 1:N | Una publicación tiene muchas categorías (ej: "Plomería" + "Electricidad") |
| Post → Application | 1:N | Una publicación recibe muchas postulaciones |
| Post → PostImage | 1:N | Una publicación tiene muchas imágenes |
| Post → Post (self) | N:0..1 | Un post puede ser sub-post de otro (subcontratos) |
| Category → PostCategory | 1:N | Una categoría aparece en muchas publicaciones |
| Category → UserCategory | 1:N | Una categoría es elegida por muchos trabajadores |
| PostCategory → Application | 1:N | Una categoría de post recibe postulaciones específicas |
| Application → WorkerReview | 1:0..1 | Una postulación puede tener como máximo 1 reseña del trabajador |
| Application → ClientReview | 1:0..1 | Una postulación puede tener como máximo 1 reseña del cliente |
| WorkerReview → User (reviewer) | N:1 | Un reviewer escribe muchas reseñas |
| WorkerReview → User (worker) | N:1 | Un trabajador recibe muchas reseñas |
| ClientReview → User (reviewer) | N:1 | Un reviewer escribe muchas reseñas |
| ClientReview → User (client) | N:1 | Un cliente recibe muchas reseñas |

### 8.3. Tablas de Asociación (Junction Tables)

| Tabla | Entidad A | Entidad B | Cardinalidad | Restricción |
|-------|-----------|-----------|--------------|-------------|
| `PostCategory` | Post | Category | N:N | UNIQUE(postId, categoryId) |
| `UserCategory` | User | Category | N:N | UNIQUE(userId, categoryId) |

### 8.4. Modelo de Datos Detallado ( Todas las Entidades )

#### User (Usuarios)

Tabla principal de usuarios. Un usuario puede ser cliente (`role="user"`) o trabajador (`role="worker"`).

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `email` | VARCHAR(255) | | | ✅ | ✅ | | Email del usuario |
| `name` | VARCHAR(100) | | | | ✅ | | Nombre |
| `surname` | VARCHAR(100) | | | | ✅ | | Apellido |
| `password` | VARCHAR(255) | | | | ✅ | | Contraseña hasheada |
| `phone` | VARCHAR(20) | | | | | NULL | Teléfono |
| `bio` | TEXT | | | | | NULL | Biografía |
| `role` | VARCHAR(20) | | | | ✅ | `"user"` | `"user"` (client) o `"worker"` |
| `created_at` | DATETIME | | | | ✅ | NOW() | Fecha de creación |
| `active` | BOOLEAN | | | | | `true` | Si la cuenta está activa |
| `deleted` | BOOLEAN | | | | | `false` | Soft delete |
| `emergencies_enabled` | BOOLEAN | | | | | `false` | Notificaciones de emergencia |
| `requires_start_token` | BOOLEAN | | | | | `false` | Si requiere token para iniciar trabajo |
| `photo` | VARCHAR(500) | | | | | NULL | URL de foto de perfil |
| `matricula_url` | VARCHAR(500) | | | | | NULL | URL de matrícula profesional |
| `availability` | TEXT | | | | | NULL | Disponibilidad horaria (JSON) |
| `telegram_chat_id` | VARCHAR(50) | | | ✅ | | NULL | ID de chat de Telegram |
| `telegram_linked_at` | DATETIME | | | | | NULL | Fecha de vinculación con Telegram |
| `national_id` | VARCHAR(20) | | | | ✅ | | DNI o documento |
| `national_id_type_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → NationalIdType |
| `address_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → Address |
| `certificates` | TEXT | | | | | NULL | Certificados (JSON) |
| `gallery` | TEXT | | | | | NULL | Galería de trabajos (JSON) |
| `kyc_status` | VARCHAR(20) | | | | | `"NOT_STARTED"` | Estado KYC |
| `kyc_verified_at` | DATETIME | | | | | NULL | Fecha de verificación |
| `didit_verification_id` | VARCHAR(100) | | | | | NULL | ID de sesión Didit |

**Índices únicos:**
- `email`
- `telegram_chat_id`

---

#### Post (Publicaciones)

Publicaciones de trabajo creadas por clientes.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `user_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User (cliente) |
| `type` | VARCHAR(20) | | | | | `"client"` | Tipo de publicación |
| `parent_post_id` | VARCHAR(36) | | ✅ | | | NULL | FK → Post (auto-relación para subcontratos) |
| `subcontract_group_id` | VARCHAR(36) | | | | | NULL | ID de grupo de subcontrato |
| `start_date` | DATETIME | | | | ✅ | | Fecha de inicio del trabajo |
| `end_date` | DATETIME | | | | ✅ | | Fecha de fin del trabajo |
| `title` | VARCHAR(200) | | | | ✅ | | Título del trabajo |
| `description` | TEXT | | | | ✅ | | Descripción detallada |
| `address` | VARCHAR(255) | | | | ✅ | | Dirección del trabajo |
| `status` | VARCHAR(20) | | | | | `"Active"` | Estado: Active, Paused, Cancelled, InProgress, Completed, Finalized |
| `latitude` | DOUBLE | | | | | NULL | Coordenada latitud |
| `longitude` | DOUBLE | | | | | NULL | Coordenada longitud |
| `is_emergency` | BOOLEAN | | | | | `false` | Si es publicación de emergencia |
| `emergency_expires_at` | DATETIME | | | | | NULL | Cuándo expira la emergencia |
| `allows_subcontracting` | BOOLEAN | | | | | `true` | Si permite subcontratación |
| `is_bidding` | BOOLEAN | | | | | `false` | Si es licitación (ofertas competitivas) |
| `bid_weights` | TEXT | | | | | NULL | Pesos de licitación (JSON) |
| `material_responsibility` | VARCHAR(20) | | | | | `"to_agree"` | Responsabilidad de materiales |
| `budget_max` | DOUBLE | | | | | NULL | Presupuesto máximo |
| `created_at` | DATETIME | | | | | NOW() | Fecha de creación |
| `updated_at` | DATETIME | | | | | NOW() | Última actualización |

**Índices:**
- `user_id` (FK)

---

#### Category (Categorías)

Categorías de trabajo (Electricidad, Plomería, etc.).

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `name` | VARCHAR(50) | | | ✅ | ✅ | | Nombre de la categoría |

**Datos iniciales (seed):**
1. Electricidad
2. Plomería
3. Carpintería
4. Pintura
5. Albañilería
6. Cerrajería
7. Aire / HVAC
8. Electrónica

---

#### PostCategory (Categorías de Publicación)

Tabla asociación N:N entre Post y Category. Permite que una publicación tenga múltiples categorías con cantidades específicas.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `post_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → Post |
| `category_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → Category |
| `quantity` | INT | | | | | `1` | Cantidad de trabajadores necesarios |
| `filled_count` | INT | | | | | `0` | Cantidad de puestos cubiertos |
| `role_description` | VARCHAR(255) | | | | | NULL | Descripción del rol específico |

**Restricción:** UNIQUE(post_id, category_id)

---

#### UserCategory (Categorías de Usuario)

Tabla asociación N:N entre User y Category. Indica las especialidades del trabajador.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `user_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User (trabajador) |
| `category_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → Category |

**Restricción:** UNIQUE(user_id, category_id)

---

#### Application (Postulaciones)

Postulaciones detalladas de trabajadores a publicaciones.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `worker_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User (trabajador) |
| `post_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → Post |
| `category_id` | VARCHAR(36) | | ✅ | | | NULL | FK → PostCategory (opcional) |
| `subcontract_group_id` | VARCHAR(36) | | | | | NULL | ID de grupo de subcontrato |
| `status` | VARCHAR(20) | | | | | `"Pending"` | Estado: Pending, Accepted, Rejected, Completed |
| `message` | TEXT | | | | | NULL | Mensaje del trabajador |
| `available_days` | TEXT | | | | | NULL | Días disponibles (JSON) |
| `available_time_from` | VARCHAR(10) | | | | | NULL | Horario disponible desde |
| `available_time_to` | VARCHAR(10) | | | | | NULL | Horario disponible hasta |
| `charges_visit` | BOOLEAN | | | | | `false` | Si cobra visita |
| `visit_cost` | DOUBLE | | | | | NULL | Costo de la visita |
| `scheduled_date` | DATETIME | | | | | NULL | Fecha programada |
| `offered_duration` | INT | | | | | NULL | Duración ofrecida (horas) |
| `requires_start_token` | BOOLEAN | | | | | `false` | Si requiere token para iniciar |
| `start_token` | VARCHAR(100) | | | | | NULL | Token de inicio |
| `start_token_expires_at` | DATETIME | | | | | NULL | Expiración del token |
| `start_token_attempts` | INT | | | | | `0` | Intentos de uso del token |
| `token_validated_at` | DATETIME | | | | | NULL | Fecha de validación del token |
| `created_at` | DATETIME | | | | | NOW() | Fecha de creación |
| `updated_at` | DATETIME | | | | | NOW() | Última actualización |

**Índices:**
- `worker_id` (FK)
- `post_id` (FK)
- UNIQUE funcional: `(worker_id, post_id, COALESCE(category_id, '__none__'))` via migración SQL

---

#### JobApplication (Postulación Legacy)

Postulaciones simplificadas (tablas legacy, coexiste con Application).

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `worker_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User |
| `post_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → Post |
| `status` | VARCHAR(20) | | | | | `"pending"` | Estado: pending, accepted, rejected |
| `created_at` | DATETIME | | | | | NOW() | Fecha de creación |

---

#### WorkerReview (Reseñas de Trabajador)

Reseñas que los clientes dejan a los trabajadores.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `application_id` | VARCHAR(36) | | ✅ | ✅ | ✅ | | FK → Application (1:1) |
| `reviewer_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User (cliente reviewer) |
| `worker_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User (trabajador) |
| `description` | TEXT | | | | ✅ | | Descripción de la reseña |
| `rating` | INT | | | | ✅ | | Calificación (1-5) |
| `media_urls` | TEXT | | | | | NULL | URLs de imágenes (JSON) |
| `created_at` | DATETIME | | | | | NOW() | Fecha de creación |

**Relación 1:1:** Cada Application puede tener como máximo 1 WorkerReview.

---

#### ClientReview (Reseñas de Cliente)

Reseñas que los trabajadores dejan a los clientes.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `application_id` | VARCHAR(36) | | ✅ | ✅ | ✅ | | FK → Application (1:1) |
| `reviewer_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User (trabajador reviewer) |
| `client_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User (cliente) |
| `description` | TEXT | | | | | NULL | Descripción de la reseña |
| `rating` | INT | | | | ✅ | | Calificación (1-5) |
| `created_at` | DATETIME | | | | | NOW() | Fecha de creación |

**Relación 1:1:** Cada Application puede tener como máximo 1 ClientReview.

---

#### PostImage (Imágenes de Publicación)

Imágenes asociadas a una publicación.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `url` | VARCHAR(500) | | | | ✅ | | URL de la imagen (Cloudinary) |
| `post_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → Post |

---

#### NationalIdType (Tipo de Documento)

Tipos de documento de identidad nacional.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `description` | VARCHAR(50) | | | | ✅ | | Descripción del tipo |

**Tabla en BD:** `national_id_type`

**Datos iniciales:** DNI

---

#### Address (Dirección)

Direcciones de usuarios.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único (mapeado como `address_id`) |
| `street` | VARCHAR(200) | | | | ✅ | | Calle |
| `number` | VARCHAR(20) | | | | ✅ | | Número |
| `city` | VARCHAR(100) | | | | ✅ | | Ciudad |
| `state` | VARCHAR(100) | | | | ✅ | | Provincia/Estado |

**Tabla en BD:** `address`

---

#### TelegramLinkCode (Códigos de Vinculación Telegram)

Códigos temporales para vincular cuentas de Telegram.

| Campo | Tipo SQL | PK | FK | UK | NN | Default | Descripción |
|-------|----------|:--:|:--:|:--:|:--:|---------|-------------|
| `id` | VARCHAR(36) | ✅ | | | ✅ | UUID | Identificador único |
| `user_id` | VARCHAR(36) | | ✅ | | ✅ | | FK → User |
| `code` | VARCHAR(20) | | | ✅ | ✅ | | Código único de vinculación |
| `expires_at` | DATETIME | | | | ✅ | | Fecha de expiración |
| `used` | BOOLEAN | | | | | `false` | Si ya fue utilizado |
| `created_at` | DATETIME | | | | | NOW() | Fecha de creación |

**Tabla en BD:** `telegram_link_code`

### 8.3. Categorías Disponibles

| Categoría | Descripción |
|-----------|-------------|
| Electricidad | Instalaciones, reparaciones, tableros |
| Plomería | Cañerías, grifería, sanitarios |
| Carpintería | Muebles, puertas, instalaciones de madera |
| Pintura | Pintura interior y exterior |
| Albañilería | Construcción, refacción, revocaciones |
| Cerrajería | Cerraduras, cilindros, apertura |
| Aire / HVAC | Instalación y mantenimiento de aires acondicionados |
| Electrónica | Reparación de equipos electrónicos |

### 8.4. Scripts de Base de Datos

| Comando | Descripción |
|---------|-------------|
| `pnpm run db:migrate -- --name <nombre>` | Crear y aplicar una migración |
| `pnpm run db:generate` | Regenerar el cliente Prisma después de cambios en el schema |
| `pnpm run db:seed` | Poblar la BD con datos de prueba |
| `pnpm run db:migrate:deploy` | Aplicar migraciones en producción |

---

## 9. Configuración de Servicios Externos

### 9.1. Auth0 (Autenticación)

Auth0 maneja la autenticación de usuarios con soporte para:
- Email/Password (base de datos own)
- Google OAuth2 (con PKCE)

#### Configuración

1. Crear cuenta en https://auth0.com
2. Crear una Application (Regular Web Application)
3. Crear una API (para el backend)
4. Crear roles: `Worker` y `Client`
5. Configurar Connection: `Username-Password-Authentication`

#### Variables requeridas

```env
# Frontend
VITE_AUTH0_DOMAIN=https://tu-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=tu_client_id
VITE_AUTH0_AUDIENCE=https://api.miapinode.com
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/auth/callback

# Backend
AUTH0_AUDIENCE=https://api.miapinode.com
AUTH0_ISSUER_BASE_URL=https://tu-tenant.us.auth0.com/
AUTH0_CLIENT_ID=tu_client_id
AUTH0_M2M_CLIENT_ID=tu_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=tu_m2m_client_secret
AUTH0_WORKER_ROLE_ID=rol_xxxxxxxxxxxxxxxx
AUTH0_CLIENT_ROLE_ID=rol_xxxxxxxxxxxxxxxx
```

#### Flujo de Autenticación

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Login  │────▶│ Auth0   │────▶│ PKCE    │────▶│ Token   │
│ Form    │     │ Redirect│     │ Exchange│     │ Guard   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │  API calls  │
                                      │ Bearer token│
                                      └─────────────┘
```

### 9.2. Didit (KYC Biométrico)

Didit permite verificar la identidad de los trabajadores mediante:
- **OCR:** Lectura de DNI argentino (ambos lados)
- **Liveness Pasivo:** Verificación de que la persona es real
- **Face Match:** Comparación selfie vs foto del documento
- **IP Analysis:** Análisis de ubicación

#### Configuración

1. Crear cuenta en https://didit.me
2. Obtener API Key del dashboard
3. Crear un workflow con los checks habilitados
4. Obtener el Workflow ID

#### Variables requeridas

```env
DIDIT_API_KEY=tu_api_key
DIDIT_WORKFLOW_ID=uuid_del_workflow
DIDIT_WEBHOOK_SECRET=secret_shared_key
DIDIT_BASE_URL=https://verification.didit.me
```

#### Flujo de Verificación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Registro    │────▶│  KYC Page    │────▶│  Didit SDK   │
│  Worker      │     │  /kyc        │     │  (iframe)    │
└──────────────┘     └──────────────┘     └──────────────┘
                           │                     │
                           │  POST /kyc/session  │
                           │◀────────────────────│
                           │                     │
                           │  POST /kyc/confirm  │
                           │◀────────────────────│
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  DB Update   │     │  Webhook     │
                    │  kycStatus   │     │  (producción)│
                    └──────────────┘     └──────────────┘
```

#### Documentación Completa

Ver `server/docs/DIDIT_DOCUMENTATION.md` para la documentación completa de la integración con Didit (954 líneas).

### 9.3. Google Gemini (Diagnóstico IA)

Gemini analiza fotos y descripciones de problemas del hogar para提供 diagnósticos y recomendaciones.

#### Configuración

1. Crear cuenta en https://aistudio.google.com
2. Generar una API Key
3. Configurar el modelo (default: `gemini-2.5-flash-lite`)

#### Variables requeridas

```env
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 9.4. Cloudinary (Imágenes)

Cloudinary almacena y gestiona imágenes de:
- Fotos de perfil de usuarios
- Imágenes de publicaciones
- Galería de trabajos del trabajador
- Certificados

#### Configuración

1. Crear cuenta en https://cloudinary.com
2. Obtener Cloud Name, API Key y API Secret

#### Variables requeridas

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 9.5. Telegram (Bot de Notificaciones)

El bot de Telegram permite:
- Vincular cuenta de usuario
- Recibir notificaciones de postulaciones y estado de publicaciones
- Consultar trabajos disponibles

#### Configuración

1. Hablar con @BotFather en Telegram
2. Crear un nuevo bot con `/newbot`
3. Obtener el token

#### Variables requeridas

```env
TELEGRAM_BOT_TOKEN=tu_token_del_bot
```

### 9.6. WhatsApp (Comunicación)

HomeFix genera enlaces de WhatsApp para contacto directo entre clientes y trabajadores, usando el servicio de mensajería del dispositivo.

**No requiere configuración adicional** — se generan links `https://wa.me/` con el número del trabajador.

---

## 10. Ejecución Local

### 10.1. Iniciar Backend

```bash
cd server
pnpm install
pnpm run dev
```

El servidor estará disponible en `http://localhost:3000`.

**Scripts disponibles:**

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Iniciar con hot reload (tsx watch) |
| `pnpm start` | Iniciar en modo producción |
| `pnpm run build` | Compilar TypeScript |
| `pnpm run lint` | Verificar código con ESLint |
| `pnpm test` | Ejecutar tests |

### 10.2. Iniciar Frontend

```bash
cd client
pnpm install
pnpm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

**Scripts disponibles:**

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Iniciar dev server con HMR |
| `pnpm run build` | Build para producción |
| `pnpm run preview` | Previsualizar build de producción |
| `pnpm run lint` | Verificar código con ESLint |
| `pnpm test` | Ejecutar tests |

### 10.3. Iniciar desde la Raíz

```bash
# Iniciar solo el frontend
pnpm dev-fe

# Iniciar solo el backend
pnpm dev-be

# Build del frontend
pnpm build-fe

# Build del backend
pnpm build-be

# Ejecutar tests del backend
pnpm test
```

### 10.4. Documentación API (Swagger)

Una vez iniciado el backend, la documentación interactiva de la API está disponible en:

```
http://localhost:3000/api-docs
```

> **[IMAGEN SUGERIDA]:** Captura de Swagger UI mostrando los endpoints disponibles.

---

## 11. Despliegue

### 11.1. Frontend — Vercel

Vercel es la plataforma de hosting recomendada para el frontend por su integración nativa con Vite y GitHub.

#### Pasos de Despliegue

1. **Conectar repositorio:**
   - Ir a https://vercel.com
   - Importar el repositorio de GitHub
   - Seleccionar la carpeta `client` como root directory

2. **Configurar Build Settings:**
   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: pnpm run build
   Output Directory: dist
   Install Command: pnpm install
   ```

3. **Configurar Variables de Entorno:**
   ```
   VITE_API_URL=https://tu-backend.railway.app
   VITE_AUTH0_DOMAIN=https://tu-tenant.us.auth0.com
   VITE_AUTH0_CLIENT_ID=tu_client_id
   VITE_AUTH0_AUDIENCE=https://api.miapinode.com
   VITE_AUTH0_CALLBACK_URL=https://tu-frontend.vercel.app/auth/callback
   ```

4. **Deploy:**
   - Vercel automáticamente despliega en cada push a `main`
   - Preview deployments en PRs

#### Configuración de Vercel (`client/vercel.json`)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Esto permite el client-side routing de React Router.

> **[IMAGEN SUGERIDA]:** Captura del dashboard de Vercel mostrando el deployment exitoso.

### 11.2. Backend — Railway

Railway soporta Dockerfiles y tiene integración con MySQL.

#### Pasos de Despliegue

1. **Conectar repositorio:**
   - Ir a https://railway.app
   - Crear nuevo proyecto
   - Seleccionar "Deploy from GitHub repo"
   - Seleccionar el repositorio

2. **Configurar servicio:**
   - Seleccionar la carpeta `server`
   - Railway detectará el `railway.json` automáticamente

3. **Agregar MySQL:**
   - En el dashboard, "New" → "Database" → "MySQL"
   - Railway provee la variable `DATABASE_URL` automáticamente

4. **Configurar Variables de Entorno:**
   ```
   DATABASE_URL=mysql://... (auto-generated by Railway)
   PORT=3000
   CORS_ORIGIN=https://tu-frontend.vercel.app
   AUTH0_AUDIENCE=https://api.miapinode.com
   AUTH0_ISSUER_BASE_URL=https://tu-tenant.us.auth0.com/
   AUTH0_M2M_CLIENT_ID=tu_m2m_client_id
   AUTH0_M2M_CLIENT_SECRET=tu_m2m_client_secret
   AUTH0_WORKER_ROLE_ID=rol_xxx
   AUTH0_CLIENT_ROLE_ID=rol_xxx
   GEMINI_API_KEY=tu_api_key
   GEMINI_MODEL=gemini-2.5-flash-lite
   CLOUDINARY_CLOUD_NAME=tu_cloud
   CLOUDINARY_API_KEY=tu_key
   CLOUDINARY_API_SECRET=tu_secret
   DIDIT_API_KEY=tu_key
   DIDIT_WORKFLOW_ID=tu_workflow_id
   DIDIT_WEBHOOK_SECRET=tu_secret
   TELEGRAM_BOT_TOKEN=tu_token
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```

5. **Deploy:**
   - Railway ejecuta automáticamente `pnpm db:migrate:deploy` antes de iniciar
   - Health check en `/health`

#### Configuración de Railway (`server/railway.json`)

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "preDeployCommand": "pnpm db:migrate:deploy",
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health"
  }
}
```

#### Dockerfile (`server/Dockerfile`)

```dockerfile
FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm build

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

> **[IMAGEN SUGERIDA]:** Captura del dashboard de Railway mostrando el servicio corriendo.

### 11.3. Producción — Checklist

| Verificación | Estado |
|-------------|--------|
| Frontend deployado en Vercel | ☐ |
| Backend deployado en Railway | ☐ |
| Base de datos MySQL configurada | ☐ |
| Migraciones ejecutadas | ☐ |
| Variables de entorno configuradas | ☐ |
| Auth0 configurado para producción | ☐ |
| CORS_ORIGIN actualizado con URL de Vercel | ☐ |
| DIDIT_CALLBACK_URL actualizado | ☐ |
| Health check funcionando (`/health`) | ☐ |
| Swagger UI accesible (`/api-docs`) | ☐ |

---

## 12. Pruebas de Implementación

### 12.1. Lista de Verificación

| Funcionalidad | Verificación | Resultado |
|--------------|-------------|-----------|
| **Login** | Iniciar sesión con email/password | ☐ OK |
| **Login Google** | Iniciar sesión con cuenta Google | ☐ OK |
| **Registro Cliente** | Crear cuenta de cliente | ☐ OK |
| **Registro Worker** | Crear cuenta de trabajador | ☐ OK |
| **KYC** | Completar verificación de identidad | ☐ OK |
| **Crear Publicación** | Cliente crea una solicitud de trabajo | ☐ OK |
| **Postularse** | Trabajador se postula a una publicación | ☐ OK |
| **Aceptar Postulación** | Cliente acepta un trabajador | ☐ OK |
| **Licitaciones** | Crear y participar de licitaciones | ☐ OK |
| **Subcontratos** | Crear y gestionar subcontratos | ☐ OK |
| **Diagnóstico IA** | Usar el diagnóstico por Gemini | ☐ OK |
| **Calificaciones** | Dejar reseña a trabajador/cliente | ☐ OK |
| **Emergencias** | Crear publicación de emergencia | ☐ OK |
| **Mapa** | Ver publicaciones en el mapa | ☐ OK |
| **Fotos** | Subir y ver imágenes | ☐ OK |
| **Bot Telegram** | Vincular cuenta y recibir notificaciones | ☐ OK |
| **PWA** | Instalar como app en móvil | ☐ OK |
| **Swagger** | Acceder a documentación API | ☐ OK |

### 12.2. Cuentas de Prueba (Seed Data)

El script `pnpm run db:seed` crea las siguientes cuentas:

| Email | Rol | Contraseña |
|-------|-----|------------|
| laura@test.com | Cliente | AUTH0_MANAGED_ACCOUNT |
| sofia@test.com | Cliente | AUTH0_MANAGED_ACCOUNT |
| trabajador@test.com | Worker | AUTH0_MANAGED_ACCOUNT |

> **Nota:** Las cuentas del seed usan AUTH0_MANAGED_ACCOUNT como placeholder. Para login real, registrar usuarios nuevos.

---

## 13. Problemas Conocidos

### 13.1. Error de Conexión a la Base de Datos

**Posible causa:** Credenciales incorrectas o MySQL no está ejecutándose.

**Solución:**
1. Verificar que MySQL esté corriendo: `mysql -u root -p`
2. Revisar `DATABASE_URL` en `server/.env`
3. Verificar que la base de datos exista: `SHOW DATABASES;`

### 13.2. Error en KYC (Didit)

**Posible causa:** API Key inválida o Workflow ID incorrecto.

**Solución:**
1. Verificar `DIDIT_API_KEY` y `DIDIT_WORKFLOW_ID` en `.env`
2. Confirmar que el workflow esté activo en el dashboard de Didit
3. Verificar que `DIDIT_WEBHOOK_SECRET` coincida con el configurado en Didit

### 13.3. Error de CORS

**Posible causa:** `CORS_ORIGIN` no coincide con la URL del frontend.

**Solución:**
1. Verificar `CORS_ORIGIN` en `server/.env` coincida con la URL exacta del frontend
2. En producción: `CORS_ORIGIN=https://tu-frontend.vercel.app`
3. Incluir `http://` o `https://` según corresponda

### 13.4. Error de Auth0 (JWT Invalid)

**Posible causa:** Audience o Issuer URL incorrecto.

**Solución:**
1. Verificar `AUTH0_AUDIENCE` coincida con el configurado en Auth0
2. Verificar `AUTH0_ISSUER_BASE_URL` termine con `/`
3. Verificar que los roles estén creados en Auth0

### 13.5. Error de Build en Vercel

**Posible causa:** Variables de entorno faltantes o error de TypeScript.

**Solución:**
1. Verificar que todas las variables `VITE_*` estén configuradas en Vercel
2. Ejecutar `pnpm run typecheck` localmente para detectar errores
3. Verificar la versión de Node.js (recomendado: v22)

### 13.6. Webhook de Didit no funciona en Desarrollo

**Posible causa:** No hay URL pública para recibir webhooks.

**Solución:**
- En desarrollo, el polling cada 10 segundos cubre esta necesidad
- Para staging/producción, configurar la URL pública del webhook en Didit
- Usar ngrok o similar para testing local: `ngrok http 3000`

### 13.7. Error "Module not found" al iniciar

**Posible causa:** Dependencias no instaladas o cache corrupta.

**Solución:**
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## 14. Mantenimiento

### 14.1. Backups de Base de Datos

**Railway:**
- Railway provee backups automáticos para planes de pago
- Para planes gratuitos, configurar backup manual

**Manual (mysqldump):**
```bash
mysqldump -u root -p homefix > backup_$(date +%Y%m%d).sql
```

**Cron job (Linux):**
```bash
0 2 * * * mysqldump -u root -p homefix > /backups/homefix_$(date +\%Y\%m\%d).sql
```

### 14.2. Actualización de Dependencias

```bash
# Ver dependencias desactualizadas
pnpm outdated

# Actualizar todas (cuidado con breaking changes)
pnpm update

# Actualizar una dependencia específica
pnpm update react
```

**Recomendaciones:**
- Ejecutar tests después de actualizar: `pnpm test`
- Revisar changelogs de dependencias mayores
- Actualizar en un branch dedicado

### 14.3. Monitoreo

**Logs del Backend:**
- Railway muestra logs en tiempo real desde el dashboard
- El backend usa `pino` logger con formato JSON
- Buscar errores: `grep "error" logs`

**Health Check:**
```
GET /health
Response: { "status": "ok" }
```

**Métricas a monitorear:**
- Tiempo de respuesta de la API
- Uso de memoria
- Errores 5xx
- Tasa de éxito de KYC
- Uso de la API de Gemini

### 14.4. Actualizaciones de Seguridad

- Mantener Node.js actualizado (usar LTS)
- Revisar dependencias con vulnerabilidades: `pnpm audit`
- Rotar API keys periódicamente
- Revisar configuración de Auth0

---

## 15. Anexos

### Anexo A: Estructura Completa del Proyecto

```
HomeFix-Nuevo/
├── client/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── icons/
│   │       ├── icon-192x192.png
│   │       └── icon-512x512.png
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── client/
│   │   │   ├── dashboard/
│   │   │   ├── landing/
│   │   │   ├── post/
│   │   │   ├── review/
│   │   │   ├── ui/
│   │   │   ├── worker/
│   │   │   ├── DiditVerificationModal.tsx
│   │   │   ├── ImageViewer.tsx
│   │   │   └── Navbar.tsx
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── auth0.ts
│   │   │   └── envConfig.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── applications.ts
│   │   │   ├── diagnostico.ts
│   │   │   ├── kyc.ts
│   │   │   └── posts.ts
│   │   ├── types/
│   │   ├── utils/
│   │   ├── views/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── RegisterWorker.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── ClientDashboard.tsx
│   │   │   ├── WorkerDashboard.tsx
│   │   │   ├── KycVerify.tsx
│   │   │   ├── CreatePost.tsx
│   │   │   ├── PostDetail.tsx
│   │   │   ├── AiDiagnosis.tsx
│   │   │   └── ... (41 vistas)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── server/
│   ├── docs/
│   │   ├── DIDIT_DOCUMENTATION.md
│   │   └── didit-setup.md
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── scripts/
│   │   ├── createDiditWorkflow.ts
│   │   └── log-coverage.ts
│   ├── src/
│   │   ├── domain/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   ├── providers/
│   │   │   ├── transformers/
│   │   │   ├── types/
│   │   │   └── webhooks/
│   │   ├── lib/
│   │   │   ├── env.ts
│   │   │   ├── envConfig.ts
│   │   │   ├── errors.ts
│   │   │   ├── logger.ts
│   │   │   └── prisma.ts
│   │   ├── presentation/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── swagger/
│   │   │   ├── transformers/
│   │   │   └── types/
│   │   └── index.ts
│   ├── test/
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── railway.json
│   └── vitest.config.ts
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

### Anexo B: Endpoints de la API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/auth/register` | No | Registrar usuario |
| `POST` | `/auth/login` | No | Iniciar sesión |
| `POST` | `/auth/register/worker` | No | Registrar trabajador |
| `GET` | `/users` | JWT | Listar usuarios |
| `GET` | `/users/:id` | JWT | Obtener usuario |
| `PATCH` | `/users/:id/emergencies` | JWT | Configurar notificaciones de emergencia |
| `GET` | `/posts` | JWT | Listar publicaciones |
| `POST` | `/posts` | JWT | Crear publicación |
| `POST` | `/posts/user-posts` | JWT | Publicaciones del usuario |
| `POST` | `/posts/emergency/create` | JWT | Crear emergencia |
| `PATCH` | `/posts/:id/pause` | JWT | Pausar publicación |
| `PATCH` | `/posts/:id/cancel` | JWT | Cancelar publicación |
| `PATCH` | `/posts/:id/complete` | JWT | Completar trabajo |
| `POST` | `/posts/biddings/:id/close` | JWT | Cerrar licitación |
| `GET` | `/workers` | JWT | Listar trabajadores |
| `GET` | `/workers/:id` | JWT | Obtener trabajador |
| `PATCH` | `/workers/:id` | JWT | Actualizar perfil trabajador |
| `GET` | `/workers/:id/reviews` | JWT | Reseñas del trabajador |
| `GET` | `/workers/:id/stats` | JWT | Estadísticas del trabajador |
| `POST` | `/applications` | JWT | Postularse a un trabajo |
| `GET` | `/applications/my-applications` | JWT | Mis postulaciones |
| `PATCH` | `/applications/:id/accept` | JWT | Aceptar postulación |
| `PATCH` | `/applications/:id/reject` | JWT | Rechazar postulación |
| `POST` | `/reviews` | JWT | Crear reseña |
| `GET` | `/reviews/:id` | JWT | Obtener reseña |
| `POST` | `/kyc/session` | JWT | Iniciar verificación KYC |
| `POST` | `/kyc/confirm` | No | Confirmar sesión KYC |
| `GET` | `/kyc/status` | JWT | Estado KYC |
| `POST` | `/kyc/webhook` | HMAC | Webhook de Didit |
| `POST` | `/upload` | JWT | Subir imágenes |
| `GET` | `/categories` | No | Listar categorías |
| `POST` | `/ai/diagnose` | JWT | Diagnóstico con IA |
| `POST` | `/telegram/link` | JWT | Vincular Telegram |
| `GET` | `/telegram/status` | JWT | Estado de vinculación |
| `GET` | `/api-docs` | No | Swagger UI |

### Anexo C: Variables de Entorno (Template)

**Frontend (`client/.env.example`):**
```env
VITE_API_URL=http://localhost:3000
VITE_AUTH0_DOMAIN=https://your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=your_auth0_audience
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/auth/callback
```

**Backend (`server/.env.example`):**
```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/homefix_db"
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
AUTH0_AUDIENCE=your_auth0_audience
AUTH0_ISSUER_BASE_URL=https://your-tenant.us.auth0.com/
AUTH0_M2M_CLIENT_ID=your_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
AUTH0_WORKER_ROLE_ID=rol_xxxxxxxxxxxxxxxx
AUTH0_CLIENT_ROLE_ID=rol_xxxxxxxxxxxxxxxx
CORS_ORIGIN=http://localhost:5173
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
DIDIT_API_KEY=your_didit_api_key
DIDIT_WORKFLOW_ID=your_didit_workflow_id
DIDIT_CALLBACK_URL=http://localhost:5173/kyc
```

### Anexo D: Diagrama de Migraciones

Las migraciones de Prisma se encuentran en `server/prisma/migrations/` y se ejecutan en orden cronológico. Las migraciones principales incluyen:

1. **init** — Esquema inicial con todos los modelos
2. **20260608190000** — Renombra `kycSessionId` a `diditVerificationId`
3. **20260619000001** — Índice unique funcional para applications

### Anexo E: Tests

**Backend:**
```bash
cd server
pnpm test                          # Todos los tests
pnpm test:coverage:service         # Coverage de servicios
pnpm test:coverage:data            # Coverage de database
pnpm test:coverage:routes          # Coverage de rutas
```

**Frontend:**
```bash
cd client
pnpm test                          # Todos los tests
pnpm test:watch                    # Watch mode
```

### Anexo F: Comandos Útiles

```bash
# Verificar variables de entorno del backend
cd server && npx tsx -e "import { env } from './src/lib/envConfig.js'; console.log(env)"

# Crear workflow de Didit (dry run)
cd server && pnpm didit:create-workflow --dry-run

# Regenerar cliente Prisma
cd server && pnpm run db:generate

# Verificar migraciones pendientes
cd server && npx prisma migrate status

# Limpiar cache de pnpm
rm -rf node_modules
pnpm install
```

---

## Imágenes Sugeridas para Agregar

Las siguientes imágenes deberían capturarse y agregarse al documento:

| # | Descripción | Ubicación sugerida |
|---|-------------|-------------------|
| 1 | Captura de la Landing Page de HomeFix | Sección 1.1 |
| 2 | Diagrama de arquitectura (generado con draw.io o Mermaid) | Sección 2.1 |
| 3 | Estructura de carpetas en el IDE | Sección 2.3 |
| 4 | Captura de Swagger UI (`/api-docs`) | Sección 10.4 |
| 5 | Captura del modal de Didit (KYC) | Sección 9.2 |
| 6 | Captura del dashboard de Vercel | Sección 11.1 |
| 7 | Captura del dashboard de Railway | Sección 11.2 |
| 8 | Captura de phpMyAdmin o MySQL Workbench con el schema | Sección 8 |
| 9 | Captura del dashboard de Auth0 | Sección 9.1 |
| 10 | Captura del dashboard de Cloudinary | Sección 9.4 |
| 11 | Flujo de registro de trabajador (pantallas) | Anexo |
| 12 | Flujo de creación de publicación (pantallas) | Anexo |

---

## Referencias

- **Documentación de Auth0:** https://auth0.com/docs
- **Documentación de Didit:** https://docs.didit.me
- **Google Gemini AI:** https://ai.google.dev/docs
- **Cloudinary:** https://cloudinary.com/documentation
- **Prisma:** https://www.prisma.io/docs
- **Express.js:** https://expressjs.com
- **React:** https://react.dev
- **Vite:** https://vite.dev
- **Vercel:** https://vercel.com/docs
- **Railway:** https://docs.railway.app

---

*Documento generado en Julio 2026*  
*Versión 1.0.0*
