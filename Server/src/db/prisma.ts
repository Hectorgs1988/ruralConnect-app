import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Cierre elegante al parar el proceso
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
