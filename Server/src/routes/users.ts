// Server/src/routes/users.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
    createUserSchema,
    createAdminSchema,
    updateUserSchema,
} from '../schemas/users.js';
import { importUserCsvRowSchema } from "../schemas/users-import.js";


export const usersRouter = Router();

// --- Constantes/reutilizables ------------------------------------------------
const SALT_ROUNDS = 10;

const USER_SELECT = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
} as const;

const requireAdmin = requireRole('ADMIN');

const toEmail = (v: string) => v.trim().toLowerCase();

const escapeCsvField = (value: unknown): string => {
    const s = value == null ? "" : String(value);
    if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};


// --- GET /api/usuarios  ------------------------------------------------------
// ?q=texto&role=ADMIN|SOCIO&active=true|false&page=1&size=10
usersRouter.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const q = (req.query.q as string | undefined)?.trim();
        const role = req.query.role as 'ADMIN' | 'SOCIO' | undefined;
        const activeParam = req.query.active as 'true' | 'false' | undefined;

        const page = Math.max(parseInt((req.query.page as string) ?? '1', 10), 1);
        const size = Math.min(
            Math.max(parseInt((req.query.size as string) ?? '10', 10), 1),
            100
        );
        const skip = (page - 1) * size;
        const take = size;

        const where: any = {};
        if (role) where.role = role;
        if (typeof activeParam !== 'undefined') where.isActive = activeParam === 'true';

        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: [{ createdAt: 'desc' }],
                select: USER_SELECT,
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            items,
            total,
            page,
            size,
            pages: Math.ceil(total / size),
        });
    } catch (e) {
        next(e);
    }
});

// --- GET /api/users/export  (exportar todos los socios a CSV) ----------------
usersRouter.get('/export', requireAuth, requireAdmin, async (_req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: [{ createdAt: 'asc' }],
            select: USER_SELECT,
        });

        const header = ['email', 'name', 'phone', 'role', 'isActive', 'createdAt'];
        const lines: string[] = [];
        lines.push(header.join(','));

        for (const u of users) {
            const row = [
                escapeCsvField(u.email),
                escapeCsvField(u.name),
                escapeCsvField(u.phone ?? ''),
                escapeCsvField(u.role),
                escapeCsvField(u.isActive ? 'true' : 'false'),
                escapeCsvField(u.createdAt.toISOString()),
            ];
            lines.push(row.join(','));
        }

        const csv = lines.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="socios.csv"');
        res.send(csv);
    } catch (e) {
        next(e);
    }
});

// --- GET /api/usuarios/:id  --------------------------------------------------
usersRouter.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const u = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: USER_SELECT,
        });
        if (!u) return res.status(404).json({ error: 'User not found' });
        res.json(u);
    } catch (e) {
        next(e);
    }
});

// --- POST /api/usuarios  (crear SOCIO) --------------------------------------
usersRouter.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const data = createUserSchema.parse(req.body);
        const email = toEmail(data.email);

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(409).json({ error: 'Email already registered' });

        const password = await bcrypt.hash(data.password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email,
                name: data.name,
                phone: data.phone ?? null,
                password,
                role: 'SOCIO', // fuerza SOCIO en este endpoint
            },
            select: USER_SELECT,
        });

        res.status(201).json(user);
    } catch (e) {
        next(e);
    }
});

// --- POST /api/usuarios/admin  (crear ADMIN) --------------------------------
usersRouter.post('/admin', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const data = createAdminSchema.parse(req.body);
        const email = toEmail(data.email);

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(409).json({ error: 'Email already registered' });

        const password = await bcrypt.hash(data.password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email,
                name: data.name,
                phone: data.phone ?? null,
                password,
                role: 'ADMIN', // fuerza ADMIN en este endpoint
            },
            select: USER_SELECT,
        });

        res.status(201).json(user);
    } catch (e) {
        next(e);
    }
});

// --- PATCH /api/usuarios/:id  (actualizar) -----------------------------------
usersRouter.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = updateUserSchema.parse(req.body);
        const targetId = req.params.id;
        const current = (req as any).user as { sub: string; role: 'ADMIN' | 'SOCIO' };

        // Protege que un admin no se auto-desactive o auto-degrade
        if (current.sub === targetId) {
            if (typeof body.isActive !== 'undefined' && body.isActive === false) {
                return res
                    .status(400)
                    .json({ error: 'No puedes desactivar tu propia cuenta' });
            }
            if (body.role && body.role !== 'ADMIN') {
                return res
                    .status(400)
                    .json({ error: 'No puedes cambiar tu propio rol a no-ADMIN' });
            }
        }

        const data: any = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.phone !== undefined) data.phone = body.phone;

        if (body.email !== undefined) data.email = toEmail(body.email);
        if (body.password) data.password = await bcrypt.hash(body.password, SALT_ROUNDS);

        if (typeof body.isActive !== 'undefined') data.isActive = body.isActive;
        if (body.role) data.role = body.role; // permitido porque requiere ADMIN

        // Si intenta cambiar el email a uno ya existente, que falle como 409
        if (data.email) {
            const exists = await prisma.user.findUnique({ where: { email: data.email } });
            if (exists && exists.id !== targetId) {
                return res.status(409).json({ error: 'Email already registered' });
            }
        }

        const updated = await prisma.user.update({
            where: { id: targetId },
            data,
            select: USER_SELECT,
        });

        res.json(updated);
    } catch (e) {
        next(e);
    }
});

// --- POST /api/users/import-csv  (importar socios desde CSV) -------------------
usersRouter.post('/import-csv', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const chunks: Buffer[] = [];

        await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });
            req.on('end', () => resolve());
            req.on('error', (err) => reject(err));
        });

        const raw = Buffer.concat(chunks).toString('utf-8');
        const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length === 0) {
            return res.status(400).json({ error: 'CSV vacío' });
        }

        // Asumimos primera línea como cabecera
        const header = lines[0].split(',').map((h) => h.trim());
        const requiredCols = ['email', 'name', 'phone', 'role'];
        for (const col of requiredCols) {
            if (!header.includes(col)) {
                return res.status(400).json({ error: `Falta la columna obligatoria: ${col}` });
            }
        }

        const idxEmail = header.indexOf('email');
        const idxName = header.indexOf('name');
        const idxPhone = header.indexOf('phone');
        const idxRole = header.indexOf('role');

        let created = 0;
        let updated = 0;
        const errors: { line: number; message: string }[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const cols = line.split(',');
            const rawRow = {
                email: cols[idxEmail]?.trim() ?? '',
                name: cols[idxName]?.trim() ?? '',
                phone: cols[idxPhone]?.trim() || undefined,
                role: (cols[idxRole]?.trim().toUpperCase() as 'ADMIN' | 'SOCIO' | undefined) ?? 'SOCIO',
            };

            let row;
            try {
                row = importUserCsvRowSchema.parse(rawRow);
            } catch (e: any) {
                errors.push({ line: i + 1, message: e?.message ?? 'Fila no válida' });
                continue;
            }

            const email = toEmail(row.email);

            try {
                const existing = await prisma.user.findUnique({ where: { email } });
                if (!existing) {
                    const password = await bcrypt.hash('socio123', SALT_ROUNDS);
                    await prisma.user.create({
                        data: {
                            email,
                            name: row.name,
                            phone: row.phone ?? null,
                            password,
                            role: row.role,
                            isActive: true,
                        },
                    });
                    created++;
                } else {
                    await prisma.user.update({
                        where: { id: existing.id },
                        data: {
                            name: row.name,
                            phone: row.phone ?? null,
                            role: row.role,
                            // si estaba borrado (isActive=false), lo reactivamos al importar
                            isActive: true,
                        },
                    });
                    updated++;
                }
            } catch (e: any) {
                errors.push({ line: i + 1, message: e?.message ?? 'Error al guardar el usuario' });
            }
        }

        res.json({ created, updated, errors });
    } catch (e) {
        next(e);
    }
});

// --- DELETE /api/usuarios/:id  (soft delete) --------------------------------
usersRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const targetId = req.params.id;
        const current = (req as any).user as { sub: string };

        if (current.sub === targetId) {
            return res
                .status(400)
                .json({ error: 'No puedes desactivar tu propia cuenta' });
        }

        await prisma.user.update({
            where: { id: targetId },
            data: { isActive: false },
        });

        res.status(204).end();
    } catch (e) {
        next(e);
    }
});

// --- PATCH /api/usuarios/:id/password  (cambiar contraseña) --------------------
usersRouter.patch('/:id/password', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;
        const current = (req as any).user as { sub: string; role: 'ADMIN' | 'SOCIO' };

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        // Si no es admin, solo puede cambiar su propia contraseña
        if (current.role !== 'ADMIN' && current.sub !== id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Busca al usuario
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Si no es admin, verificar contraseña actual
        if (current.role !== 'ADMIN') {
            const valid = await bcrypt.compare(oldPassword, user.password);
            if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Encriptar nueva contraseña
        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await prisma.user.update({
            where: { id },
            data: { password: hashed, updatedAt: new Date() },
        });

        res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (e) {
        next(e);
    }
});

