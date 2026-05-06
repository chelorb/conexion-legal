# 🚀 Guía de Deploy en Railway
## Conexión Legal — Despliegue completo paso a paso

Railway ofrece un plan gratuito de $5/mes de crédito, suficiente para empezar.
No requiere tarjeta de crédito.

---

## 1. Crear cuenta en Railway

1. Ir a [railway.app](https://railway.app)
2. Registrarse con GitHub (recomendado)

---

## 2. Subir el proyecto a GitHub

```bash
# Desde la carpeta raíz del proyecto
git init
git add .
git commit -m "primer commit"

# Crear repo en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/conexion-legal.git
git push -u origin main
```

**Importante:** Asegurarse de que `.gitignore` incluya:
```
node_modules/
.env
uploads/
```

---

## 3. Crear el proyecto en Railway

1. En el dashboard de Railway → **New Project**
2. Elegir **Deploy from GitHub repo**
3. Seleccionar el repositorio `conexion-legal`

---

## 4. Configurar la Base de Datos (PostgreSQL)

1. En el proyecto → **New Service** → **Database** → **PostgreSQL**
2. Railway crea la DB automáticamente
3. Ir a la DB → **Variables** → copiar `DATABASE_URL`

---

## 5. Configurar el Backend

1. En el proyecto → **New Service** → seleccionar la carpeta `/backend`
2. Railway detecta automáticamente que es Node.js
3. En **Settings** → **Root Directory** → escribir `backend`
4. En **Variables** → agregar todas las variables de `.env.example`:

```
NODE_ENV=production
DATABASE_URL=<copiar de la DB de Railway>
JWT_SECRET=<string aleatorio de 64 chars — usar: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
MP_ACCESS_TOKEN=<tu token de MercadoPago>
MP_PUBLIC_KEY=<tu clave pública de MercadoPago>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<tu email>
SMTP_PASS=<contraseña de aplicación de Gmail>
FRONTEND_URL=<URL del frontend — la obtenés en el siguiente paso>
```

5. En **Settings** → **Start Command** → `npm start`
6. En **Settings** → ejecutar las migraciones una vez:
   - **Deploy** → ir a la consola del servicio
   - Ejecutar: `npm run migrate`

---

## 6. Configurar el Frontend

1. En el proyecto → **New Service** → seleccionar la carpeta `/frontend`
2. En **Settings** → **Root Directory** → escribir `frontend`
3. En **Settings** → **Build Command** → `npm run build`
4. En **Settings** → **Start Command** → `npx serve dist`
5. En **Variables**:

```
VITE_API_URL=<URL del backend de Railway + /api>
```

---

## 7. Configurar dominios

1. Ir a cada servicio → **Settings** → **Public Networking** → **Generate Domain**
2. Obtendrás URLs como:
   - Backend: `https://conexion-legal-api.railway.app`
   - Frontend: `https://conexion-legal.railway.app`

3. Actualizar las variables:
   - En el backend: `FRONTEND_URL=https://conexion-legal.railway.app`
   - En el frontend: `VITE_API_URL=https://conexion-legal-api.railway.app/api`

---

## 8. MercadoPago — Configuración

### Obtener credenciales:
1. Ir a [developers.mercadopago.com](https://developers.mercadopago.com)
2. Crear una aplicación
3. Copiar **Access Token** y **Public Key** de producción

### Configurar Webhook:
1. En MercadoPago → **Tu aplicación** → **Webhooks**
2. URL del webhook: `https://conexion-legal-api.railway.app/api/pagos/webhook`
3. Evento: **payment**

---

## 9. Gmail SMTP — Configuración

Para usar Gmail como servidor de email:

1. Ir a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en dos pasos (debe estar activada)
3. Seguridad → **Contraseñas de aplicación**
4. Crear una contraseña para "Correo" → copiar los 16 caracteres
5. Usar esa contraseña en `SMTP_PASS`

---

## 10. Crear el primer administrador

Después del deploy, crear el admin desde la consola de Railway:

```sql
-- Conectarse a la DB de Railway (con el cliente psql o desde Railway)
-- Primero registrar el usuario por la API normal, luego cambiar su rol:

UPDATE usuarios 
SET rol_id = (SELECT id FROM roles WHERE nombre = 'admin')
WHERE email = 'tu@email.com';
```

---

## 🔧 Variables de entorno completas

### Backend (.env en producción)
| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` (Railway lo asigna automáticamente) |
| `DATABASE_URL` | URL de PostgreSQL (Railway la provee) |
| `JWT_SECRET` | String aleatorio seguro (mínimo 32 chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `MP_ACCESS_TOKEN` | Token de MercadoPago |
| `MP_PUBLIC_KEY` | Clave pública de MercadoPago |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Email de notificaciones |
| `SMTP_PASS` | Contraseña de aplicación de Gmail |
| `FRONTEND_URL` | URL del frontend en Railway |

### Frontend (.env en producción)
| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL del backend + `/api` |

---

## 📊 Monitoreo

Railway provee:
- **Logs** en tiempo real por servicio
- **Métricas** de CPU y memoria
- **Alertas** por email si el servicio cae

---

## 🔄 CI/CD automático

Cada `git push` a `main` hace deploy automático en Railway. No hace falta hacer nada manual.

Para evitar deploys automáticos en un push específico:
```bash
git commit -m "mensaje [skip ci]"
```

---

## 💰 Escalado

Cuando el proyecto crezca y necesite más recursos:
1. Railway → servicio → **Settings** → **Resources**
2. Aumentar RAM y CPU según necesidad
3. El costo se ajusta automáticamente

Para base de datos con más capacidad:
- Considerar migrar a **Supabase** (PostgreSQL gestionado, 500MB gratis)
- O **Neon** (serverless PostgreSQL)
