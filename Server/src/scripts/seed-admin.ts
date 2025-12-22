import { prisma } from '../db/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
    const email = 'admin@test.com';
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        console.log('Admin ya existe:', email);
        return;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: passwordHash,
            name: 'Admin Ejemplo',
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log('Admin creado:', user.email);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
