# Server/Dockerfile

FROM node:20

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instalar certificados raíz del sistema (por si acaso)
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

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

# The container runs the backend in production mode; local Compose overrides this.
ENV NODE_ENV=production

# Copiar el entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Puerto donde escucha el backend
EXPOSE 4000

# Usar el entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
