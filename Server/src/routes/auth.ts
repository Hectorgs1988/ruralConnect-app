import { Router } from "express";
import { prisma } from "../db/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";
import { sendPasswordResetEmail } from "../services/email.js";
import { getPasswordPolicyError } from "../utils/password-policy.js";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";
const auth = Router();

// POST /api/auth/login { email, password }
auth.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};
        if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales' });

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

        if (user.mustSetPassword) {
            return res.status(403).json({ error: 'Debes activar tu cuenta desde el enlace enviado al correo.' });
        }

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

// POST /api/auth/forgot-password { email }
auth.post("/forgot-password", async (req, res, next) => {
    try {
        const { email } = req.body ?? {};
        if (!email) {
            return res.status(400).json({ error: "Email requerido" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        // Para no filtrar si el email existe o no, respondemos siempre OK
        if (!user) {
            return res.json({ ok: true });
        }

        const token = jwt.sign(
            { sub: user.id, type: "reset-password" },
            JWT_SECRET,
            { expiresIn: "30m" },
        );

        const resetUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;

        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl,
        });

        res.json({ ok: true });
    } catch (e) {
        next(e);
    }
});

// POST /api/auth/reset-password { token, password }
auth.post("/reset-password", async (req, res, next) => {
    try {
        const { token, password } = req.body ?? {};
        if (!token || !password) {
            return res
                .status(400)
                .json({ error: "Token y nueva contraseña son requeridos" });
        }
        const passwordError = getPasswordPolicyError(password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch {
            return res
                .status(400)
                .json({ error: "Token de recuperacion invalido o caducado" });
        }

        const tokenType = payload?.type;
        if ((tokenType !== "reset-password" && tokenType !== "setup-password") || !payload?.sub) {
            return res
                .status(400)
                .json({ error: "Token de recuperacion invalido" });
        }

        const userId = payload.sub as string;

        const hashed = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed, mustSetPassword: false },
        });

        res.json({ ok: true });
    } catch (e) {
        next(e);
    }
});


export { auth };
