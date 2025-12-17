# 🏡 RuralConnect App

Aplicación web para la gestión de socios, eventos, reservas y viajes compartidos de la asociación Rural Connect (Burgos).

Proyecto desarrollado con:

- **Frontend:** React + TypeScript + Vite  
- **Backend:** Node.js + Express + Prisma  
- **Base de datos:** MySQL (Docker)  
- **ORM:** Prisma  
- **Infraestructura:** Docker + Docker Compose  

---


# 🔑 1. Variables de entorno

## 📌 `.env` (raíz del proyecto — Docker Compose)

```env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=xx
MYSQL_USER=xx
MYSQL_PASSWORD=xx
```

---

## 📌 `/Server/.env` (Prisma + Backend)

```env
DATABASE_URL="mysql://pena_user:pena_pwd@db:3306/pena"
SHADOW_DATABASE_URL="mysql://root:root@db:3306/prisma_shadow"

PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
APP_BASE_URL=http://localhost:5173

JWT_SECRET=xx

# Email / SendGrid
SENDGRID_API_KEY=xx
SENDGRID_FROM_EMAIL=xx
```

---

# 🧷 Notas importantes

## 🔐 JWT_SECRET

Generar un secreto largo y aleatorio:

- https://randomkeygen.com → sección **CodeIgniter Encryption Keys**  
- O desde terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📧 SendGrid (Opcional)

Si no configuras SendGrid:

✔ Toda la aplicación web funcionara sin nungun problema  
❌ No se enviarán emails  

Para activarlo:

1. Crear cuenta en https://sendgrid.com  
2. Verificar un email  
3. Crear API Key  
4. Insertarla en `SENDGRID_API_KEY`  

---

## ⚠️ Nota sobre TLS dentro de Docker

En el Dockerfile del backend se incluye:

```dockerfile
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
```

Esto evita errores al ejecutar `npx prisma generate` en Windows/red corporativa dentro del contenedor Docker.  
Solo aplica en desarrollo.

---
## Acceder a la aplicación

- Frontend → http://localhost:5173  
- Backend → http://localhost:4000  
- Adminer → http://localhost:8080  

Credenciales creadas automáticamente:

### 👤 Administrador
- Email: `admin@test.com`
- Password: `xxx`

### 👤 Socio
- Email: `socio@test.com`
- Password: `xxx`

---
---

# 📜 2. Scripts útiles (backend)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Ejecuta backend con autoreload |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta backend compilado |
| `npx prisma studio` | UI para gestionar la DB |
| `npm run seed:admin` | Crea admin de pruebas |
| `npm run seed:socio` | Crea socio de pruebas |

---

# 🐳 3. Arquitectura Docker

Stack incluido en `docker-compose.yml`:

- `db` → MySQL  
- `adminer` → cliente SQL  
- `backend` → Node + Prisma (migraciones + seeds automáticos)  
- `frontend` → Vite (modo desarrollo)  

Comando principal:

```bash
docker compose up --build
```

---

# 🚀 4. Despliegue en producción (opcional)

## Backend

```bash
cd Server
npm install
npm run build
npm start
```

---

## Frontend

```bash
npm install
npm run build
npm run preview
```

---

# 🔄 5. Flujo de trabajo (GitFlow)

1. Crear rama desde `develop`
2. Implementar cambios  
3. Commit  
4. Pull Request hacia `develop`  
5. Revisar + merge  
6. Eventualmente → merge `develop` → `main`  

---

# 🧹 6. Problemas comunes

## ❌ Backend devuelve “Unexpected token '<' …”

El backend no ha arrancado.

Solución:

```bash
docker compose logs backend
```

---

## ❌ No aparecen tablas en Adminer

```bash
cd Server
npx prisma migrate dev
```

---

## ❌ Error descargando binarios de Prisma dentro de Docker

Solución incluida:

```dockerfile
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## ❌ BBDD corrupta o con permisos incorrectos

```bash
docker compose down -v
docker compose up --build
```


---

