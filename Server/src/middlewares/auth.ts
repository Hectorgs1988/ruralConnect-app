// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";


//const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: "Token requerido" });
    try {
        (req as any).user = jwt.verify(m[1], JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Token inválido" });
    }
}

export function requireRole(role: "ADMIN" | "SOCIO") {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "No autenticado" });
        if (user.role !== role) {
            return res.status(403).json({ error: "No autorizado" });
        }
        next();
    };
}

export const requireAdmin = requireRole("ADMIN");
export const requireSocio = requireRole("SOCIO");
