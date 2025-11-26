#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Ejecutando seeds (admin y socio)..."
npm run seed:admin || echo "seed:admin falló. Continuando..."
npm run seed:socio || echo "seed:socio falló. Continuando..."

echo "Iniciando servidor..."
npm run start:prod
