# ⚖️ Conexión Legal — Plataforma de Asesoría Legal Digital

Plataforma web que conecta clientes con abogados profesionales verificados. Incluye campus multimedia, foro interno, gestión de turnos, suscripciones, sistema de notificaciones en tiempo real y panel de administración completo.

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
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Tiempo real | Socket.io (WebSockets) |
| Base de datos | PostgreSQL (Neon) |
| Autenticación | JWT + bcrypt |
| Pagos | MercadoPago *(pendiente credenciales)* |
| Email | Nodemailer + SMTP *(pendiente config)* |
| Deploy frontend | Vercel |
| Deploy backend | Render |

---

## 👥 Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| **Admin** | Gestiona toda la plataforma: aprueba abogados, crea contenido, envía comunicados |
| **Abogado** | Se suscribe, crea perfil, gestiona consultas y accede al campus |
| **Cliente** | Busca abogados, agenda consultas, deja calificaciones |

---

## 💼 Planes de Suscripción (Abogados)

| Plan | Precio | Incluye |
|------|--------|---------|
| **Básico** | $4.999/mes | Perfil verificado, hasta 20 consultas/mes, gestión de turnos |
| **Comunidad** | $9.999/mes | Todo lo anterior + campus completo, foro, agenda de eventos, credencial virtual, beneficios exclusivos |

> Los planes y precios son configurables desde el panel de administración.

---

## ✅ Funcionalidades Implementadas

### Públicas
- Landing con portales diferenciados (clientes / abogados)
- Catálogo público de abogados con filtros (zona, especialidad, modalidad)
- Perfil público del abogado con reseñas y calificaciones
- Página de planes y precios

### Clientes
- Registro y login
- Búsqueda y filtros de abogados
- Agendar consulta con selector de fecha y horario
- Mis consultas: historial, cancelación y calificación
- Chat interno con el abogado (pre/post consulta)
- Notificaciones en tiempo real (campana)

### Abogados
- Registro en 2 pasos con documentación obligatoria:
  - Credencial del letrado
  - Título universitario
  - Constancia de CUIL
- Panel con sidebar de navegación
- Dashboard con estadísticas, próximo evento y links de interés
- Gestión de consultas con chat interno
- Campus multimedia (cursos, podcasts, videos, biblioteca)
- Agenda de eventos con inscripción
- Foro interno de la comunidad (categorías → hilos → respuestas)
- Beneficios y descuentos exclusivos
- Credencial virtual
- Gestión de suscripción con historial de pagos

### Administración
- Gestión de abogados: revisión de documentación, aprobación/rechazo, edición de perfil
- Gestión de usuarios: habilitar/deshabilitar, editar datos personales
- **Gestión de planes**: crear/editar/eliminar planes, funcionalidades custom, migración automática de suscriptores
- Gestión de campus: crear/editar/desactivar contenido
- Gestión de eventos: crear/editar/cancelar
- Gestión de links de interés (aparecen en el sidebar del abogado)
- **Envío de comunicados** a usuarios segmentados (todos, abogados, clientes, usuario específico)
- Dashboard con estadísticas globales

---

## 🔔 Sistema de Notificaciones

Notificaciones en tiempo real via **WebSockets (Socket.io)** + guardadas en base de datos.

### Eventos que generan notificaciones

| Evento | Destinatario | Canal |
|--------|-------------|-------|
| Nuevo abogado registrado | Admin | 🔔 Tiempo real (campana) |
| Perfil aprobado | Abogado | 🔔 Tiempo real + 📧 Email |
| Perfil rechazado | Abogado | 🔔 Tiempo real + 📧 Email |
| Nueva solicitud de consulta | Abogado | 🔔 Tiempo real + 📧 Email |
| Consulta confirmada | Cliente | 🔔 Tiempo real + 📧 Email |
| Consulta cancelada por abogado | Cliente | 🔔 Tiempo real |
| Nuevo mensaje en consulta | Destinatario | 🔔 Tiempo real + 📧 Email |
| Comunicado manual del admin | Segmento elegido | 🔔 Tiempo real |

> El email se activa configurando las variables SMTP en el backend.

### Campana en el Navbar
- Contador de no leídas en rojo
- Dropdown con últimas 30 notificaciones
- Click en notificación → navega al link correspondiente y la marca como leída
- "Marcar todas como leídas" con un click

---

## 🔐 Flujo de Aprobación de Abogados

```
Registro → Pendiente → Revisión del admin (documentos + perfil)
              ↓              ↓
          Aprobado      Rechazado (con motivo)
              ↓              ↓
      Visible en grilla   Pantalla de rechazo con motivo
```

Mientras está pendiente, el abogado ve una pantalla de espera y no puede acceder al dashboard.

---

## 📦 Instalación Local

### Requisitos
- Node.js 18+
- PostgreSQL 14+ (o cuenta en Neon)
- npm

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Completar variables (ver sección Variables de Entorno)
npm run dev            # Servidor en http://localhost:3001 + Socket.io
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # Completar VITE_API_URL
npm run dev            # App en http://localhost:5173
```

### Migraciones (ejecutar en orden en Neon o PostgreSQL local)
```
001_schema_inicial.sql
002_flujo_aprobacion.sql
003_planes_basico_comunidad.sql
004_foro.sql
005_links_interes.sql
006_mensajes_consulta.sql
007_plan_funcionalidades.sql
008_documentos_registro.sql
```

---

## 🌐 Deploy

| Servicio | Plataforma | Notas |
|----------|-----------|-------|
| Frontend | **Vercel** | Auto-deploy desde GitHub. Configurar `VITE_API_URL` |
| Backend | **Render** | Auto-deploy desde GitHub. Plan gratuito |
| Base de datos | **Neon** | PostgreSQL serverless. Plan gratuito |

### Variables de entorno — Backend (Render)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secreto_seguro
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tu-app.vercel.app
PORT=3001

# Email (opcional — activa notificaciones por email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu@gmail.com
EMAIL_PASS=app_password_de_gmail

# MercadoPago (pendiente)
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
```

### Variables de entorno — Frontend (Vercel)

```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

---

## 👤 Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@conexionlegal.com | Admin1234 |
| Abogado (Comunidad) | maria@test.com | Password1 |
| Abogado (Básico) | carlos@test.com | Password1 |
| Cliente | ana@test.com | Password1 |

---

## 📋 Endpoints principales de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Registro (multipart para abogados con docs) |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/abogados` | Catálogo público con filtros |
| GET | `/api/abogados/:id` | Perfil público del abogado |
| GET | `/api/notificaciones` | Mis notificaciones |
| PATCH | `/api/notificaciones/leer-todas` | Marcar todas como leídas |
| POST | `/api/notificaciones/comunicado` | Comunicado admin |
| GET | `/api/consultas` | Mis consultas |
| POST | `/api/consultas` | Nueva consulta (cliente) |
| PATCH | `/api/consultas/:id/estado` | Cambiar estado (abogado) |
| POST | `/api/consultas/:id/mensajes` | Enviar mensaje en consulta |
| GET | `/api/admin/abogados` | Gestión de abogados (admin) |
| PUT | `/api/admin/planes-gestion/:id` | Editar plan (admin) |

---

## 🔐 Seguridad

- Passwords hasheados con bcrypt (salt: 12)
- Tokens JWT con expiración configurable
- Validación de inputs en todos los endpoints
- CORS configurado por entorno
- Subida de archivos con validación de tipo y tamaño (máx 10MB)
- Rutas protegidas por rol en frontend y backend

---

## 🗂️ Estructura de carpetas

```
backend/src/
├── app.js                  → Express app
├── server.js               → HTTP server + Socket.io
├── config/
│   └── database.js         → Conexión PostgreSQL
├── controllers/
│   ├── auth.controller.js
│   ├── abogados.controller.js
│   └── consultas.controller.js
├── middleware/
│   ├── auth.middleware.js
│   └── validacion.middleware.js
├── migrations/             → Scripts SQL (001–008)
├── routes/                 → Definición de endpoints
└── services/
    ├── email.service.js
    └── notificaciones.service.js  → Socket.io + DB

frontend/src/
├── components/
│   └── layout/             → Navbar, Footer
├── context/
│   └── AuthContext.jsx     → Estado global de autenticación
├── hooks/
│   └── useNotificaciones.js → Socket.io client
├── pages/
│   ├── Inicio.jsx
│   ├── Login.jsx
│   ├── Registro.jsx (2 pasos para abogados)
│   ├── Planes.jsx
│   ├── PortalClientes.jsx
│   ├── PortalAbogados.jsx
│   ├── PerfilAbogado.jsx
│   ├── abogado/            → Dashboard, Consultas, Campus, Agenda, Foro, etc.
│   ├── cliente/            → MisConsultas, DetalleConsulta
│   └── admin/              → Dashboard, Abogados, Usuarios, Planes, Comunicado, etc.
└── services/
    └── api.js              → Axios configurado
```

---

## ⏳ Pendiente

- [ ] Configuración de SMTP para emails
- [ ] Integración completa con MercadoPago (webhook + activación de plan)
- [ ] Calificación post-consulta (flujo automático)
- [ ] App mobile (React Native o PWA)

---

## 📄 Licencia

Proyecto privado — © Conexión Legal. Todos los derechos reservados.
