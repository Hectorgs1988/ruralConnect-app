// Server/src/schemas/users.ts
import { z } from "zod";

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    phone: z.string().optional(),
});

export const createAdminSchema = createUserSchema; // mismo shape, pero rol forzado a ADMIN en la ruta

export const updateUserSchema = z.object({
    email: z.string().trim().lowercase().email().optional(),
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    role: z.enum(["ADMIN", "SOCIO"]).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(6).optional(),
});