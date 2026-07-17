# ⚖️ IUSTIXIUM — Plataforma Legal Digital Argentina

Plataforma web que conecta clientes con abogados profesionales verificados. Incluye campus multimedia, foro interno, gestión de consultas y turnos, sistema de suscripciones por planes, notificaciones en tiempo real y panel de administración completo.

🌐 **Producción:** https://conexion-legal-xi.vercel.app  
🔧 **API:** https://conexion-legal.onrender.com

---

## 🏗️ Arquitectura

```
conexion-legal/
├── backend/    → API REST + WebSockets (Node.js + Express + Socket.io + PostgreSQL)
└── frontend/   → Interfaz de usuario (React + Vite + TailwindCSS)
```

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + TailwindCSS → Vercel |
| Backend | Node.js + Express + Socket.io → Render |
| Base de datos | PostgreSQL (Neon) |
| Autenticación | JWT (8h) + sesión única por usuario |
| Almacenamiento | Cloudinary (documentos, avatares, campus) |
| Email | SendGrid HTTP API |
| Pagos | MercadoPago *(deshabilitado — pendiente activar)* |

---

## 👥 Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| **Admin** | Gestiona toda la plataforma: aprueba abogados, crea contenido, envía comunicados, audita acciones |
| **Abogado** | Se suscribe por plan, crea perfil verificado, gestiona consultas y accede al campus |
| **Cliente** | Busca abogados, agenda consultas, califica y se comunica por chat interno |

---

## 💼 Planes de Suscripción

Los planes son **100% configurables desde el panel de administración** — precios, funcionalidades y nombres se gestionan dinámicamente. Cualquier plan nuevo creado desde el admin impacta automáticamente en el sistema.

Los planes actuales se configuran desde `/admin/planes`.

---

## ✅ Funcionalidades Implementadas

### Públicas
- Landing con portales diferenciados (clientes / abogados)
- Catálogo público de abogados con filtros por especialidad y localidad
- Perfil público del abogado con calificaciones
- Página de planes y precios

### Clientes
- Registro, login y verificación de email
- Búsqueda y filtros de abogados
- Agendar consulta con selector de fecha y horario disponible
- Mis consultas: historial, cancelación y calificación post-consulta
- Chat interno con el abogado
- Notificaciones en tiempo real (campana)

### Abogados
- Registro con documentación obligatoria subida a Cloudinary:
  - Credencial del letrado
  - Título universitario
  - Constancia de CUIL
- Panel completo con dashboard de estadísticas
- Gestión de disponibilidad semanal
- Gestión de consultas con mensajería interna
- Campus multimedia por plan (cursos, podcasts, videos, biblioteca)
- Agenda de eventos con código QR de acceso
- Foro interno de la comunidad
- Beneficios y descuentos exclusivos por plan
- Credencial virtual
- Gestión de suscripción y solicitud de cambio de plan

### Administración
- Gestión de abogados: documentos, aprobación/rechazo, edición de perfil, verificación manual de email
- Gestión de usuarios: habilitar/deshabilitar, editar datos personales
- Gestión de planes: crear/editar/eliminar, funcionalidades custom, notificación automática a suscriptores al cambiar precios
- Gestión de campus: contenido con multi-select de planes, subida de archivos a Cloudinary
- Gestión de eventos: crear/editar/cancelar, inscriptos, validación QR
- Gestión de beneficios exclusivos: crear/editar/activar/desactivar
- Links de interés para el dashboard del abogado
- Comunicados segmentados (todos, abogados, clientes, usuario específico)
- Log de auditoría completo de acciones críticas (admin y abogado) con IP y timestamp
- Dashboard con estadísticas globales

---

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt** (salt: 12)
- **JWT** con expiración de 8 horas
- **Sesión única por usuario** — nuevo login invalida sesiones anteriores
- **Cierre automático por inactividad** a los 30 minutos (con aviso previo de 2 minutos)
- **hCaptcha** en el registro para prevenir bots
- **Rate limiting** en endpoints sensibles (login, registro, reenvío de verificación, mensajes)
- Validación de inputs en todos los endpoints críticos
- CORS configurado por entorno
- Archivos validados por tipo y tamaño (máx 20MB en campus, 5MB en avatares)
- Auditoría de todas las acciones críticas con IP registrada

---

## 🔔 Sistema de Notificaciones

Notificaciones en tiempo real via **WebSockets (Socket.io)** + persistidas en base de datos.

| Evento | Destinatario | Canal |
|--------|-------------|-------|
| Nuevo abogado registrado | Admin | 🔔 Tiempo real + 📧 Email |
| Perfil aprobado/rechazado | Abogado | 🔔 Tiempo real + 📧 Email |
| Nueva consulta | Abogado | 🔔 Tiempo real + 📧 Email |
| Consulta confirmada/cancelada | Cliente | 🔔 Tiempo real + 📧 Email |
| Nuevo mensaje | Destinatario | 🔔 Tiempo real + 📧 Email |
| Comunicado del admin | Segmento elegido | 🔔 Tiempo real + 📧 Email |
| Cambio de precio de plan | Abogados suscriptos | 📧 Email |
| Solicitud/aprobación/rechazo de cambio de plan | Admin/Abogado | 📧 Email |

---

## 🔐 Flujo de Aprobación de Abogados

```
Registro → Pendiente → Revisión del admin (documentos + perfil)
              ↓              ↓
          Aprobado      Rechazado (con motivo)
              ↓              ↓
      Visible en grilla   Puede re-registrarse (si el admin lo habilita)
```

---

## 📦 Instalación Local

### Requisitos
- Node.js 18+
- Cuenta en Neon (PostgreSQL serverless)
- Cuenta en Cloudinary
- Cuenta en SendGrid

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Completar variables de entorno
npm run dev            # Servidor en http://localhost:10000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # App en http://localhost:5173
```

### Migraciones SQL
Ejecutar en orden en Neon:
```
001_schema_inicial.sql
002_flujo_aprobacion.sql
003_planes_basico_comunidad.sql
004_foro.sql
005_links_interes.sql
006_mensajes_consulta.sql
007_plan_funcionalidades.sql
008_documentos_registro.sql
009_disponibilidad.sql
009_documentos_abogado.sql
010_inscripciones_codigos.sql
011_foro_moderacion.sql
012_config_plataforma.sql
013_session_token.sql
014_email_original.sql
015_plan_solicitado.sql
016_auditoria_admin.sql
```

También ejecutar manualmente en Neon:
```sql
-- Columna de planes múltiples en campus
ALTER TABLE contenido_campus 
ADD COLUMN IF NOT EXISTS planes_requeridos TEXT[] DEFAULT ARRAY['comunidad'];

-- Columnas de inscripciones a eventos
ALTER TABLE inscripciones_eventos
  ADD COLUMN IF NOT EXISTS codigo_acceso VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS asistio       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS validado_en   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS creado_en     TIMESTAMP DEFAULT NOW();
```

---

## 🌐 Deploy

| Servicio | Plataforma | Notas |
|----------|-----------|-------|
| Frontend | **Vercel** | Auto-deploy desde GitHub. Sin configuración adicional |
| Backend | **Render** | Auto-deploy desde GitHub. Plan Starter recomendado para producción |
| Base de datos | **Neon** | PostgreSQL serverless. Plan Pro recomendado para producción |
| Archivos | **Cloudinary** | Plan gratuito (25GB) suficiente para empezar |
| Emails | **SendGrid** | Plan gratuito (100/día). Configurar SPF/DKIM con dominio propio |

### Variables de entorno — Backend (Render)

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
JWT_SECRET=string_largo_y_aleatorio
JWT_EXPIRES_IN=8h
FRONTEND_URL=https://tu-app.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@tudominio.com
HCAPTCHA_SECRET_KEY=ES_xxx
```

### Variables de entorno — Frontend (Vercel)

```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

---

## 💰 Costos estimados de producción

| Servicio | Plan | Costo |
|----------|------|-------|
| Dominio | .com.ar o .com | ~USD 1/mes |
| Render | Starter (servidor siempre activo) | USD 7/mes |
| Neon | Pro (backups automáticos) | USD 19/mes |
| Vercel | Hobby (dominio custom) | Gratis |
| Cloudinary | Free | Gratis |
| SendGrid | Free | Gratis |
| **Total** | | **~USD 27/mes** |

> **Importante:** el plan gratuito de Render duerme el servidor tras 15 minutos de inactividad. Para producción real se requiere el plan Starter (USD 7/mes).

---

## 🗂️ Estructura de carpetas

```
backend/src/
├── app.js                      → Express app + rutas
├── server.js                   → HTTP server + Socket.io
├── config/
│   └── database.js             → Conexión PostgreSQL (Neon)
├── controllers/
│   ├── auth.controller.js      → Registro, login, verificación
│   ├── abogados.controller.js  → Perfil y dashboard del abogado
│   └── consultas.controller.js → CRUD de consultas y mensajes
├── middleware/
│   ├── auth.middleware.js      → JWT + sesión única + requireRol + requirePlanFeature
│   └── validacion.middleware.js → express-validator
├── migrations/                 → Scripts SQL numerados
├── routes/                     → Endpoints por dominio
└── services/
    ├── auditoria.service.js    → Log de acciones críticas
    ├── cloudinary.service.js   → Subida de archivos
    ├── email.service.js        → SendGrid HTTP API
    └── notificaciones.service.js → Socket.io + DB

frontend/src/
├── components/layout/          → Navbar, Footer
├── context/AuthContext.jsx     → Estado global + inactividad
├── pages/
│   ├── abogado/                → Dashboard, Campus, Agenda, Foro, etc.
│   ├── cliente/                → MisConsultas, DetalleConsulta
│   └── admin/                  → Dashboard, Abogados, Usuarios, Planes,
│                                  Campus, Beneficios, Comunicado, Auditoría, etc.
└── services/api.js             → Axios con interceptores JWT
```

---

## ⏳ Pendiente para siguientes fases

- [ ] Configuración de SPF/DKIM en SendGrid con dominio propio (elimina spam)
- [ ] Activación de MercadoPago (descomentar rutas en `pagos.routes.js` y `app.js`)
- [ ] Múltiples archivos por item del campus (tabla `campus_archivos`)
- [ ] Credencial virtual (activar `credencial_virtual` en los planes correspondientes)
- [ ] App mobile (React Native o PWA)
- [ ] 2FA para el administrador
- [ ] Refresh tokens (mejora de seguridad a largo plazo)

---

## 📄 Licencia

Proyecto privado — © IUSTIXIUM. Todos los derechos reservados.
