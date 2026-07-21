// Server/src/schemas/users.ts
import { z } from "zod";
import { getPasswordPolicyError, PASSWORD_POLICY_HINT } from "../utils/password-policy.js";

export const createUserSchema = z.object({
    email: z.string().email(),
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
    password: z
        .string()
        .optional()
        .refine((value) => !value || !getPasswordPolicyError(value), {
            message: PASSWORD_POLICY_HINT,
        }),
});