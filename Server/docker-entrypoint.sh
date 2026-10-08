#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Iniciando servidor..."
npm run start:prod
