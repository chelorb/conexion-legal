# 📂 Guía de GitHub y Git para VSCode
## Conexión Legal — Flujo de trabajo profesional

---

## ✅ Comandos iniciales (solo una vez)

Desde la terminal de VSCode, con la carpeta `conexion-legal` abierta:

```bash
# 1. Inicializar Git en el proyecto
git init

# 2. Agregar todos los archivos al staging area
git add .

# 3. Hacer el primer commit
git commit -m "feat: estructura inicial del proyecto Conexión Legal"

# 4. Renombrar la rama principal (estándar moderno)
git branch -M main

# 5. Conectar con tu repositorio de GitHub
#    (reemplazar con tu URL real)
git remote add origin https://github.com/TU_USUARIO/conexion-legal.git

# 6. Subir el código a GitHub
git push -u origin main
```

✅ Entrá a tu repositorio en GitHub y vas a ver todos los archivos.

---

## 🔄 Flujo de trabajo diario

Cada vez que trabajés en el proyecto:

```bash
# Ver qué archivos cambiaron
git status

# Ver los cambios en detalle (línea por línea)
git diff

# Agregar todos los cambios al staging
git add .

# O agregar solo un archivo específico
git add backend/src/controllers/abogados.controller.js

# Hacer commit con mensaje descriptivo
git commit -m "feat: agregar filtro por especialidad en búsqueda de abogados"

# Subir a GitHub
git push
```

---

## 📝 Convención de mensajes de commit

Usamos el estándar **Conventional Commits** para tener un historial limpio:

| Prefijo | Cuándo usarlo |
|---------|---------------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Cambios en documentación |
| `style:` | Cambios de estilo/CSS |
| `refactor:` | Reestructuración de código sin cambiar funcionalidad |
| `chore:` | Tareas de mantenimiento (actualizar deps, etc.) |
| `test:` | Agregar o modificar tests |

### Ejemplos reales del proyecto:
```bash
git commit -m "feat: implementar dashboard del abogado con estadísticas"
git commit -m "fix: corregir validación de fecha en nueva consulta"
git commit -m "style: ajustar diseño responsive de la grilla de abogados"
git commit -m "docs: actualizar guía de deploy en Railway"
git commit -m "chore: actualizar dependencias de seguridad"
```

---

## 🌿 Trabajo con ramas (para cada funcionalidad nueva)

```bash
# Crear rama nueva para una funcionalidad
git checkout -b feature/campus-multimedia

# Trabajar, hacer commits normalmente...
git add .
git commit -m "feat: agregar listado de cursos del campus"

# Subir la rama a GitHub
git push origin feature/campus-multimedia

# Cuando está lista, volver a main y fusionar
git checkout main
git merge feature/campus-multimedia

# Subir main actualizado
git push

# Eliminar la rama ya fusionada
git branch -d feature/campus-multimedia
```

### Ramas recomendadas para este proyecto:
- `feature/perfil-abogado` — Edición del perfil
- `feature/campus` — Campus multimedia
- `feature/credencial-virtual` — Credencial digital
- `feature/panel-admin` — Panel de administración
- `feature/mercadopago` — Integración de pagos

---

## 🖥️ Usar Git desde la interfaz de VSCode (sin terminal)

VSCode tiene Git integrado en la barra lateral izquierda (ícono de bifurcación):

1. **Ver cambios**: click en el ícono → aparecen los archivos modificados
2. **Staging**: click en `+` al lado de cada archivo (o `+` global para todos)
3. **Commit**: escribir el mensaje arriba → `Ctrl + Enter`
4. **Push**: click en `...` → `Push`

También podés instalar la extensión **GitLens** para ver historial de cambios por línea.

---

## 🔐 Autenticación con GitHub (si pide usuario/contraseña)

GitHub ya no acepta contraseña para git push. Hay dos opciones:

### Opción A — Token personal (más fácil):
1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token → marcar `repo` → Generate
3. Copiar el token
4. Cuando git pida contraseña → pegar el token

### Opción B — GitHub CLI (recomendado):
```bash
# Instalar GitHub CLI desde: cli.github.com
gh auth login
# Seguir el asistente → elige HTTPS → autenticación por browser
```

---

## 🆘 Comandos de emergencia

```bash
# Deshacer el último commit (sin perder los cambios)
git reset --soft HEAD~1

# Descartar cambios en un archivo (volver al último commit)
git checkout -- backend/src/app.js

# Ver historial de commits
git log --oneline

# Sincronizar con GitHub (si alguien más hizo cambios)
git pull

# Ver todas las ramas
git branch -a
```

---

## 📦 Después de clonar en una computadora nueva

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/conexion-legal.git

# Entrar a la carpeta
cd conexion-legal

# Instalar dependencias del backend
cd backend && npm install

# Instalar dependencias del frontend
cd ../frontend && npm install

# Copiar y completar variables de entorno
cp backend/.env.example backend/.env
# (editar .env con los valores reales)

# Levantar con Docker o directamente
cd .. && docker-compose up
```
