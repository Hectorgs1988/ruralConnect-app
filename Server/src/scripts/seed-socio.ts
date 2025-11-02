import { prisma } from '../db/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
    const email = 'socio@test.com';
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        console.log('Socio ya existe:', email);
        return;
    }

    const passwordHash = await bcrypt.hash('socio123', 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: passwordHash,
            name: 'Socio Ejemplo',
            role: 'SOCIO',
            isActive: true,
        },
    });

    console.log('Socio creado:', user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
