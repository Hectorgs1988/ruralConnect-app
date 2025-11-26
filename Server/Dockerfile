# Server/Dockerfile

FROM node:20

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instalar certificados raíz del sistema (por si acaso)
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

# Solo para entorno de desarrollo: desactivar verificación TLS
# Para evitar el error "unable to verify the first certificate" al descargar dependencias de npm
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

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

# Usar el entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
