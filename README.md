# 🏡 Susinos App

Aplicación web para la gestión de socios, eventos y reservas de usa asociación de un entorno rural.
Proyecto desarrollado con:

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + Prisma
- **Base de datos:** MySQL (Docker)
- **ORM:** Prisma

---

## 📦 Requisitos previos

Antes de comenzar asegúrate de tener instalado:

- Node.js 18+
- npm
- Docker + Docker Compose
- (Opcional) Adminer, DBeaver o TablePlus

---

## ⚙️ Estructura del proyecto

~~~text
susinos-app/
├── docker-compose.yml
├── .env.example
│
├── Server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│
└── src/
    ├── components/
    ├── pages/
    ├── services/
    └── ...
~~~

---

# ⚡ 0. Guía rápida: arrancar todo en local

1. Clonar este repositorio en tu máquina.
2. En la **raíz del proyecto** (`susinos-app/`), arrancar Docker (MySQL + Adminer):

~~~bash
cp .env.example .env
docker compose up -d
~~~

3. En una terminal, arrancar el **backend**:

~~~bash
cd Server
cp .env.example .env     # solo la primera vez
npm install              # solo la primera vez
npx prisma generate      # solo la primera vez
npx prisma migrate dev   # solo la primera vez
npm run dev
~~~

4. En otra terminal, en la **raíz del proyecto**, arrancar el **frontend**:

~~~bash
cd susinos-app           # si no estás ya en la raíz
npm install              # solo la primera vez
npm run dev
~~~

- Backend: http://localhost:4000
- Frontend: http://localhost:5173


---


# 🔑 1. Variables de entorno

## 📌 `.env` en la raíz (Docker Compose)

~~~env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=pena
MYSQL_USER=pena_user
MYSQL_PASSWORD=pena_pwd
~~~

Normalmente NO hay que cambiar nada.

---

## 📌 `/Server/.env` (Prisma + backend)

~~~env
DATABASE_URL="mysql://pena_user:pena_pwd@localhost:3306/pena"
SHADOW_DATABASE_URL="mysql://root:root@localhost:3306/prisma_shadow"

PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
APP_BASE_URL=http://localhost:5173

JWT_SECRET=changeme_jwt_secret

# Email / SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=rconnect.rural@gmail.com
~~~

Puedes modificar:

- JWT_SECRET (producción)
- PORT (si 4000 está ocupado)

---

# 📝 Ajustes tras copiar `.env.example`

Tras ejecutar `cp .env.example .env` revisa:

### 📌 `.env` raíz
✔ Normalmente no requiere cambios.

### 📌 `/Server/.env`
   - En producción, genera un secreto largo y aleatorio (por ejemplo):

     ```bash
     # usando Node
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

     # o con openssl
     openssl rand -hex 32
     ```

   - Para que funcionen los emails (SendGrid) necesitas:
     - `SENDGRID_API_KEY`: la API Key de tu cuenta de SendGrid
     - `SENDGRID_FROM_EMAIL`: el email verificado desde el que se enviarán los correos

✔ Cambiar **JWT_SECRET** en producción.
❌ No cambiar `DATABASE_URL` salvo casos especiales.

---

# 📜 2. Scripts útiles backend

| Script | Descripción |
|--------|-------------|
| npm run dev | Ejecuta backend con autoreload |
| npm run build | Compila backend |
| npm start | Ejecuta versión compilada |
| npx prisma studio | UI para gestionar la base de datos |
| npm run seed:admin | Inserta un admin |
| npm run seed:socio | Inserta socios |

---

# 🚀 3. Despliegue / producción (opcional)

Si quieres desplegar la aplicación en un servidor (o simplemente probar el modo producción en local), estos son los pasos básicos.

## Backend (Server/)

1. Asegúrate de tener la base de datos accesible (puede ser la misma de Docker o una MySQL externa).
2. Configura `/Server/.env` con las variables correctas (`DATABASE_URL`, `PORT`, `JWT_SECRET`, etc.).
3. Desde la carpeta `Server/`:

~~~bash
cd Server
npm install      # si no lo hiciste ya
npm run build    # compila a dist/
npm start        # arranca el backend compilado
~~~

El backend escuchará en `PORT` (por defecto 4000).

## Frontend (susinos-app raíz)

1. Desde la raíz del proyecto (`susinos-app/`):

~~~bash
npm install      # si no lo hiciste ya
npm run build    # genera la carpeta dist/
~~~

2. Opciones para servir el frontend:
   - Usar `npm run preview` para probar localmente la build:

   ~~~bash
   npm run preview
   ~~~

   - O copiar el contenido de `dist/` a un servidor estático (Nginx, Apache, Netlify, Vercel, etc.).

3. Recuerda ajustar en el backend la variable `FRONTEND_ORIGIN` (en `/Server/.env`) para que coincida con la URL donde sirvas el frontend en producción.

---

3. `docker compose up -d`
4. `cd Server` → `npm install`
5. `npx prisma generate`
6. `npx prisma migrate dev`
7. `npm run dev` (backend)
8. `npm run dev` (frontend)
9. Crear branch desde develop
10. PR hacia develop

---

# 🧹 4. Problemas comunes

## ❌ `@prisma/client did not initialize yet`

~~~bash
cd Server
npm install
npx prisma generate
~~~

## ❌ No aparecen tablas en Adminer

~~~bash
npx prisma migrate dev
~~~

## ❌ MySQL falla por permisos

~~~bash
docker compose down -v
docker compose up -d
~~~

---

