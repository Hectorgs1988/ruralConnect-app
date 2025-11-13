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

# 🐳 1. Levantar base de datos (MySQL + Adminer)

## 1️⃣ Copiar variables de entorno para Docker

~~~bash
cp .env.example .env
~~~

## 2️⃣ Levantar contenedores

~~~bash
docker compose up -d
~~~

Esto iniciará:

- MySQL → `localhost:3306`
- Adminer → `http://localhost:8080`

---

# 🛠️ 2. Configurar y levantar el backend (Node + Prisma + Express)

## 1️⃣ Entrar al backend

~~~bash
cd Server
~~~

## 2️⃣ Crear archivo de entorno

~~~bash
cp .env.example .env
~~~

## 3️⃣ Instalar dependencias

~~~bash
npm install
~~~

## 4️⃣ Generar cliente Prisma

~~~bash
npx prisma generate
~~~

## 5️⃣ Aplicar migraciones

~~~bash
npx prisma migrate dev
~~~

(Alternativa)

~~~bash
npx prisma db push
~~~

## 6️⃣ Ejecutar backend

~~~bash
npm run dev
~~~

Backend en:

👉 http://localhost:4000

---

# 🎨 3. Levantar el frontend

~~~bash
npm install
npm run dev
~~~

Frontend en:

👉 http://localhost:5173

---

# 🔑 4. Variables de entorno

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

JWT_SECRET=changeme_jwt_secret
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
✔ Cambiar **JWT_SECRET** en producción.  
❌ No cambiar `DATABASE_URL` salvo casos especiales.

---

# 📜 5. Scripts útiles backend

| Script | Descripción |
|--------|-------------|
| npm run dev | Ejecuta backend con autoreload |
| npm run build | Compila backend |
| npm start | Ejecuta versión compilada |
| npx prisma studio | UI para gestionar la base de datos |
| npm run seed:admin | Inserta un admin |
| npm run seed:socio | Inserta socios |

---

# 👥 6. Flujo recomendado para colaboradores

1. Clonar repo  
2. Copiar `.env.example` → `.env` (root y Server)  
3. `docker compose up -d`  
4. `cd Server` → `npm install`  
5. `npx prisma generate`  
6. `npx prisma migrate dev`  
7. `npm run dev` (backend)  
8. `npm run dev` (frontend)  
9. Crear branch desde develop  
10. PR hacia develop  

---

# 🧹 7. Problemas comunes

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

