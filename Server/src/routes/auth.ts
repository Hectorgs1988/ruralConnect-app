import { Router } from "express";
import { prisma } from "../db/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middlewares/auth";
import { JWT_SECRET } from "../config/jwt.js";


const auth = Router();
//const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// POST /api/auth/login { email, password }
auth.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};
        if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

        const token = jwt.sign(
            { sub: user.id, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (e) { next(e); }
});

export { auth };
