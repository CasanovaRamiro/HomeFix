# OFIX - Plataforma de Servicios de Reparación

Una plataforma moderna que conecta clientes con profesionales calificados para servicios de reparación a domicilio. Búsqueda inteligente, diagnóstico asistido por IA, chat integrado y sistema de reputación.

## Características Principales

### Para Clientes
- **Búsqueda Inteligente**: Encuentra profesionales cerca de ti con filtros avanzados
- **Diagnóstico IA**: Wizard de 3 pasos que identifica exactamente qué servicio necesitas
- **Perfiles Detallados**: Información completa de profesionales, calificaciones y reviews
- **Chat Integrado**: Comunícate directamente con profesionales antes de contratar
- **Gestión de Turnos**: Dashboard para ver y administrar todos tus turnos
- **Sistema SOS**: Botón flotante para emergencias urgentes

### Para Profesionales
- **Perfil Profesional**: Mostrar tu experiencia, certificaciones y disponibilidad
- **Sistema de Reputación**: Calificaciones y reviews de clientes anteriores
- **Verificación de Identidad**: Incrementa confianza con badge de verificación

## Stack Tecnológico

- **Framework**: Next.js 16 (React + Node.js)
- **Styling**: Tailwind CSS + shadcn/ui
- **UI Components**: shadcn/ui (Button, Card, Input, etc.)
- **Data**: Mock data (Sin base de datos en esta versión MVP)
- **Language**: TypeScript

## Estructura del Proyecto

```
/app
  /page.tsx              # Landing page
  /search/page.tsx       # Búsqueda de profesionales
  /worker/[id]/page.tsx  # Perfil de trabajador
  /diagnostico/page.tsx  # Wizard de diagnóstico
  /dashboard/page.tsx    # Dashboard de cliente
  /layout.tsx            # Layout raíz
  /globals.css           # Estilos globales

/components
  /Navbar.tsx            # Navegación principal
  /Footer.tsx            # Footer
  /SearchForm.tsx        # Formulario de búsqueda
  /WorkerCard.tsx        # Tarjeta de trabajador
  /ReviewCard.tsx        # Tarjeta de review
  /RatingStars.tsx       # Componente de calificación
  /VerificationBadge.tsx # Badge de verificación
  /CategoryCard.tsx      # Tarjeta de categoría
  /DiagnosticoWizard.tsx # Wizard de diagnóstico
  /SOS.tsx               # Botón de emergencia

/lib/data
  /workers.ts            # Datos de profesionales
  /reviews.ts            # Datos de reviews
  /categories.ts         # Datos de categorías
  /bookings.ts           # Datos de turnos
  /conversations.ts      # Datos de conversaciones
```

## Rutas Disponibles

| Ruta | Descripción |
|------|------------|
| `/` | Página de inicio (Landing) |
| `/search` | Búsqueda de profesionales con filtros |
| `/worker/[id]` | Perfil detallado de un profesional |
| `/diagnostico` | Wizard de diagnóstico IA |
| `/dashboard` | Dashboard de cliente con turnos y mensajes |

## Diseño y Colores

### Paleta de Colores (Minimalista y Profesional)
- **Primary**: #0066CC (Azul profesional)
- **Background**: #FFFFFF (Blanco)
- **Foreground**: #141414 (Gris oscuro)
- **Secondary**: #F5F5F5 (Gris claro)
- **Muted**: #EFEFEF (Gris neutro)
- **Border**: #E8E8E8 (Gris de bordes)

### Tipografía
- **Font**: Geist (sans-serif)
- **Headings**: Bold (700)
- **Body**: Regular (400)

## Características de Diseño

✓ **Responsive Design**: Funciona perfectamente en mobile, tablet y desktop
✓ **Accesibilidad**: Cumple con estándares WCAG
✓ **Performance**: Optimizado con Next.js
✓ **Dark Mode**: Compatible con preferencias del sistema
✓ **Animaciones Sutiles**: Transiciones suaves y hover states

## Componentes Principales

### Navbar
- Logo y branding
- Links de navegación
- Autenticación
- Responsive menu para mobile

### SearchForm
- Búsqueda por texto
- Filtro por categoría
- Filtro por ubicación
- Submit button

### WorkerCard
- Imagen del trabajador
- Rating y número de reviews
- Ubicación y distancia
- Tarifa horaria
- Tiempo de respuesta
- Button de "Ver Perfil"

### DiagnosticoWizard
- 3 pasos interactivos
- Preguntas sobre el problema
- Ubicación del cliente
- Progress bar
- Resultados y recomendaciones

### Dashboard
- Estadísticas de turnos
- Lista de turnos activos y completados
- Chat integrado con profesionales
- Estados de reservas (Pending, Confirmed, In-Progress, Completed)

## Cómo Usar

### Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Ejecutar servidor de desarrollo
pnpm dev

# Build para producción
pnpm build

# Ejecutar en producción
pnpm start
```

La aplicación estará disponible en `http://localhost:3000`

### Flujos Principales

#### 1. Búsqueda de Profesionales
1. Ir a `/search`
2. Usar filtros por categoría, ubicación, calificación
3. Ordenar por distancia, calificación o precio
4. Hacer clic en "Ver Perfil" para ver detalles

#### 2. Usar Diagnóstico
1. Ir a `/diagnostico`
2. Responder 3 preguntas sobre el problema
3. Ingresar ubicación
4. Ver recomendaciones de profesionales

#### 3. Ver Perfil de Profesional
1. Ir a `/worker/[id]`
2. Ver información completa
3. Leer reviews
4. Usar chat para comunicarse
5. Agendar cita

#### 4. Dashboard de Cliente
1. Ir a `/dashboard`
2. Ver turnos activos y completados
3. Ver conversaciones con profesionales
4. Enviar mensajes

## Datos Mock

La aplicación incluye datos mock para:
- 6 profesionales con perfil completo
- 8 categorías de servicios
- 6 reviews de clientes
- 3 turnos de ejemplo
- 2 conversaciones activas

Los datos están en `/lib/data/` y pueden ser reemplazados fácilmente con un backend real.

## Próximas Fases

Para convertir esto en una aplicación productiva:

1. **Base de Datos**: Integrar Supabase o similar
2. **Autenticación**: Implementar auth con NextAuth o Supabase Auth
3. **APIs Reales**: Conectar endpoints reales
4. **Pagos**: Integrar Stripe o PaymentLink
5. **Notificaciones**: Email/SMS con Resend o Twilio
6. **IA Real**: Integrar Claude, GPT-4 o Groq para diagnóstico real
7. **Mapas**: Integrar Google Maps para ubicaciones
8. **Deployment**: Publicar en Vercel

## Scripts Disponibles

- `pnpm dev` - Inicia servidor de desarrollo
- `pnpm build` - Build para producción
- `pnpm start` - Ejecuta build de producción
- `pnpm lint` - Ejecuta linter

## Personalización

### Agregar Categorías
Editar `/lib/data/categories.ts` y agregar nuevas categorías

### Agregar Profesionales
Editar `/lib/data/workers.ts` con nuevos trabajadores

### Cambiar Colores
Editar `/app/globals.css` para actualizar las variables CSS

### Agregar Páginas
Crear nuevas rutas en `/app` siguiendo la estructura de Next.js

## Licencia

Proyecto de demostración. Libre para usar y modificar.

## Soporte

Para preguntas o soporte, contacta al equipo de desarrollo.

---

**Construido con** React, Next.js 16, TypeScript y Tailwind CSS.
