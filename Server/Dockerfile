# Server/Dockerfile
FROM node:20

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar prisma y generar cliente
COPY prisma ./prisma
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript a dist/
RUN npm run build

# Copiar el entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Puerto donde escucha el backend
EXPOSE 4000

# Usar el strypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
