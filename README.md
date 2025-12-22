# 🏡 RuralConnect App

Aplicación web para la gestión de **socios, eventos, reservas de espacios y viajes compartidos** de una asociación rural.

## 1. Qué es el proyecto y cómo está desarrollado

**Funcionalidades principales**
- Gestión de socios (roles ADMIN y SOCIO)
- Gestión de eventos con inscripciones y control de aforo
- Reserva de espacios de la peña
- Compartir coche (viajes y solicitudes de viaje)
- Panel de administración / dashboard

**Stack técnico**
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + Prisma
- **Base de datos:** MySQL
- **ORM:** Prisma
- **Infraestructura:** Docker + Docker Compose

---

## 2. Puesta en marcha con Docker (recomendada)

### 2.1. Requisitos
- Docker
- Docker Compose

### 2.2. Preparar ficheros `.env`

En la raíz del proyecto:

```bash
cp .env.example .env
cp Server/.env.example Server/.env
```

**`.env` (raíz)** – ejemplo (ya en `.env.example`):

```env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=database
MYSQL_USER=user
MYSQL_PASSWORD=password

VITE_API_URL=http://localhost:4000
```

**`Server/.env` (backend)** – ejemplo (ya en `Server/.env.example`):

```env
DATABASE_URL="mysql://pena_user:pena_pwd@db:3306/pena"
SHADOW_DATABASE_URL="mysql://root:root@db:3306/prisma_shadow"

PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
APP_BASE_URL=http://localhost:5173

JWT_SECRET=changeme_jwt_secret

# Email / SendGrid (opcional)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=rconnect.rural@gmail.com
```

> ❗ **Importante**: cambia `JWT_SECRET` por un valor seguro (ver sección 4).

### 2.3. Levantar toda la stack

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

Se levantarán los servicios definidos en `docker-compose.yml`:
- `db` → MySQL
- `adminer` → cliente SQL
- `backend` → API Node + Prisma (migraciones + seeds automáticos)
- `frontend` → app React (servida en el puerto 5173)

En el primer arranque el backend ejecuta migraciones y los scripts de semillas (`seed:admin` y `seed:socio`).

### 2.4. URLs de acceso
- **Frontend (app):** http://localhost:5173
- **Backend (API):** http://localhost:4000
- **Swagger UI:** http://localhost:4000/api-docs
- **Healthcheck:** http://localhost:4000/health
- **Adminer (DB):** http://localhost:8080

### 2.5. Usuarios creados automáticamente

Al levantar el backend en Docker se crean usuarios de ejemplo:

- 👤 **Administrador**  → email `admin@test.com`, password `admin123`
- 👤 **Socio**          → email `socio@test.com`, password `socio123`

---

## 3. Puesta en marcha en local (sin Docker para código)

Si prefieres ejecutar backend y frontend en tu máquina (usando o no Docker para la BBDD):

### 3.1. Preparar `.env`

Igual que con Docker:

```bash
cp .env.example .env
cp Server/.env.example Server/.env
```

### 3.2. Arrancar base de datos (opción rápida con Docker)

```bash
docker compose up -d db adminer
```

### 3.3. Backend en local

```bash
cd Server
npm install
npx prisma migrate dev
npm run seed:admin
npm run seed:socio
npm run dev
```

El backend quedará en `http://localhost:4000`.

### 3.4. Frontend en local

```bash
cd /ruta/al/proyecto   # raíz
npm install
npm run dev
```

El frontend quedará en `http://localhost:5173`.

---

## 4. JWT_SECRET

El backend usa `JWT_SECRET` para firmar los tokens de autenticación.

Para generar un secreto largo y aleatorio puedes usar, por ejemplo:

- https://randomkeygen.com → sección **CodeIgniter Encryption Keys**
- O desde terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el valor generado en `Server/.env`:

```env
JWT_SECRET=el_valor_aleatorio_que_has_generado
```

---

## 5. Envío de emails (SendGrid)

La aplicación puede enviar emails para:
- Confirmación/cancelación de reservas
- Inscripción/baja en eventos
- Viajes compartidos (altas/bajas/cancelación)
- Recuperación de contraseña

Si **no** configuras SendGrid:
- ✔ La aplicación funcionará igualmente (web + API)
- ❌ Simplemente no se enviarán correos

Para activarlo rellena en `Server/.env`:

```env
SENDGRID_API_KEY=tu_api_key
SENDGRID_FROM_EMAIL=tu_email_verificado@dominio.com
```

---

## 6. Scripts útiles (backend)

Desde el directorio `Server/`:

| Script               | Descripción                        |
|----------------------|-----------------------------------|
| `npm run dev`        | Ejecuta backend en modo desarrollo |
| `npm run build`      | Compila a `dist/`                  |
| `npm start`          | Ejecuta backend compilado          |
| `npx prisma studio`  | UI para gestionar la base de datos |
| `npm run seed:admin` | Crea admin de pruebas              |
| `npm run seed:socio` | Crea socio de pruebas              |
