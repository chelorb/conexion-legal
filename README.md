# ⚖️ Conexión Legal — Plataforma de Asesoría Legal Digital

Plataforma web/app que conecta clientes con abogados profesionales, con campus multimedia, gestión de turnos y sistema de suscripciones.

---

## 🏗️ Arquitectura del Proyecto

```
conexion-legal/
├── backend/          → API REST (Node.js + Express + PostgreSQL)
├── frontend/         → Interfaz de usuario (React + Vite + TailwindCSS)
├── docs/             → Documentación técnica y de API
└── docker-compose.yml → Orquestación de servicios
```

---

## 🚀 Stack Tecnológico

| Capa          | Tecnología              | Por qué                                      |
| ------------- | ----------------------- | -------------------------------------------- |
| Frontend      | React 18 + Vite         | Rápido, amplio ecosistema                    |
| Estilos       | TailwindCSS             | Diseño profesional sin CSS manual            |
| Backend       | Node.js + Express       | JavaScript full-stack, simple y escalable    |
| Base de datos | PostgreSQL              | Relacional, robusto, gratis en Railway       |
| Auth          | JWT + bcrypt            | Estándar seguro para APIs REST               |
| Pagos         | MercadoPago             | Líder en Argentina                           |
| Deploy        | Railway                 | Gratis para comenzar, escala automáticamente |
| Email         | Nodemailer + Gmail SMTP | Envío de notificaciones                      |

---

## 👥 Roles de Usuario

1. **Administrador** → Gestiona toda la plataforma, aprueba perfiles, crea contenido
2. **Abogado** → Se suscribe, crea perfil, gestiona consultas y accede al campus
3. **Cliente** → Busca abogados, agenda consultas, deja calificaciones

---

## 💼 Planes de Suscripción (Abogados)

| Plan         | Precio | Funcionalidades                                             |
| ------------ | ------ | ----------------------------------------------------------- |
| **Gratuito** | $0/mes | Perfil básico, aparece en grilla                            |
| **Básico**   | $X/mes | + Gestión de turnos, campus básico                          |
| **Premium**  | $X/mes | + Todo el campus, credencial virtual, beneficios exclusivos |

---

## 📦 Instalación Local

### Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Completar variables de entorno
npm run migrate        # Crear tablas en la base de datos
npm run seed           # Datos de prueba (opcional)
npm run dev            # Servidor en http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Completar variables de entorno
npm run dev            # App en http://localhost:5173
```

---

## 🌐 Deploy en Railway (Gratis)

Ver [docs/deploy-railway.md](docs/deploy-railway.md) para guía paso a paso.

---

## 📋 Variables de Entorno

Ver [docs/variables-entorno.md](docs/variables-entorno.md) para descripción completa.

---

## 📡 API REST

Ver [docs/api.md](docs/api.md) para documentación completa de endpoints.

---

## 🔐 Seguridad

- Passwords hasheados con bcrypt (salt rounds: 12)
- Tokens JWT con expiración configurable
- Rate limiting en endpoints críticos
- Validación de inputs con express-validator
- CORS configurado por entorno
- Variables sensibles solo en `.env` (nunca en el código)

---

## 📄 Licencia

Proyecto privado — © Conexión Legal. Todos los derechos reservados.
