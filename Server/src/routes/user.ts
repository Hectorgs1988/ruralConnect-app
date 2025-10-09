import { Router } from "express";
import { prisma } from "../db/prisma";
import bcrypt from "bcrypt";
import { requireRole } from "../middlewares/auth";

const router = Router();

// Todas requieren ADMIN
router.use(requireRole("ADMIN"));

router.get("/", async (req, res) => {
    const q = String(req.query.q || "");
    const users = await prisma.user.findMany({
        where: q ? {
            OR: [
                { email: { contains: q } },
                { name: { contains: q } },
                { phone: { contains: q } },
            ],
        } : undefined,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    res.json(users);
});

router.post("/", async (req, res) => {
    const { email, name, phone, role, password } = req.body as {
        email: string; name: string; phone?: string; role: "SOCIO" | "ADMIN"; password: string;
    };
    const hash = await bcrypt.hash(password, 10);
    const u = await prisma.user.create({
        data: { email, name, phone: phone || null, role, password: hash },
        select: { id: true, email: true, name: true, phone: true, role: true },
    });
    res.status(201).json(u);
});

router.put("/:id", async (req, res) => {
    const { name, phone, role, password } = req.body as { name?: string; phone?: string; role?: "ADMIN" | "SOCIO"; password?: string; };
    const data: any = { name, phone, role };
    if (password) data.password = await bcrypt.hash(password, 10);
    const u = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: { id: true, email: true, name: true, phone: true, role: true },
    });
    res.json(u);
});

router.delete("/:id", async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
});

export default router;
