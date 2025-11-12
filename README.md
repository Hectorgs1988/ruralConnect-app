📘 README.md — Susinos App
🏡 Susinos App

Aplicación web para la gestión de socios, eventos y reservas de la Peña.
Proyecto desarrollado en React + TypeScript + Vite (frontend) y Node.js + Express + Prisma + MySQL (backend).

📦 Requisitos previos

Antes de empezar asegúrate de tener instalado:

Node.js 18+

npm

Docker + Docker Compose

(Opcional) Cliente MySQL como Adminer, TablePlus o DBeaver

⚙️ Estructura del proyecto
susinos-app/
├── docker-compose.yml
├── .env.example           <-- Variables para Docker (MySQL)
│
├── Server/                <-- Backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   ├── package.json
│   ├── .env.example       <-- Variables del backend
│
└── src/                   <-- Frontend (React)
    ├── components/
    ├── pages/
    ├── services/
    └── ...

🐳 1. Levantar base de datos (MySQL + Adminer)
1️⃣ Copiar variables de entorno para Docker

En la raíz del proyecto:

cp .env.example .env

2️⃣ Levantar contenedores
docker compose up -d


Esto lanzará:

MySQL → localhost:3306

Adminer → http://localhost:8080 (o el puerto configurado)

🛠️ 2. Configurar y levantar el backend (Node + Prisma + Express)
1️⃣ Entrar al backend
cd Server

2️⃣ Crear tu archivo .env
cp .env.example .env

3️⃣ Instalar dependencias
npm install

4️⃣ Generar el cliente Prisma
npx prisma generate

5️⃣ Aplicar migraciones (crea las tablas)
npx prisma migrate dev


Si alguien prefiere sincronizar sin migraciones:

npx prisma db push

6️⃣ Ejecutar backend
npm run dev


Backend disponible en:

http://localhost:4000

🎨 3. Levantar el frontend (React + Vite)

En otra terminal, en la raíz del proyecto:

npm install
npm run dev


Frontend disponible en:

http://localhost:5173

🔑 4. Variables de entorno
📌 Root (/.env) — Usado por Docker Compose
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=pena
MYSQL_USER=pena_user
MYSQL_PASSWORD=pena_pwd

📌 Backend (/Server/.env) — Usado por Prisma + Express
DATABASE_URL="mysql://pena_user:pena_pwd@localhost:3306/pena"
SHADOW_DATABASE_URL="mysql://root:root@localhost:3306/prisma_shadow"
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=changeme_jwt_secret

📜 5. Scripts útiles del backend
npm run dev         # Arranca backend con autoreload
npm run build       # Compila TypeScript
npm start           # Ejecuta la build del backend
npm run migrate     # prisma migrate dev
npx prisma studio   # UI web para gestionar la base de datos
npm run seed:admin  # Inserta administrador inicial
npm run seed:socio  # Inserta socios de prueba

👥 6. Flujo recomendado para colaboradores

Clonar el repo

Crear .env desde .env.example (root + Server)

docker compose up -d

Entrar a /Server → instalar dependencias

Generar Prisma

Migrar la base de datos

Levantar backend

Levantar frontend

Crear branch desde develop

Abrir PR hacia develop

🧹 7. Problemas comunes
❌ @prisma/client did not initialize yet

Solución:

cd Server
npm install
npx prisma generate

❌ Adminer no muestra tablas

Ejecutar migraciones:

npx prisma migrate dev

❌ MySQL da error de permisos

Recrear volumen:

docker compose down -v
docker compose up -d

🎯 Estado actual del proyecto

✔️ Backend operativo

✔️ Frontend operativo

✔️ Docker configurado

✔️ Prisma funcionando con migraciones

🔄 Próximos pasos: testing + documentación de endpoints