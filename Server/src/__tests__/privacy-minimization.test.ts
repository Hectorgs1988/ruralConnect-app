import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

vi.mock("../db/prisma.js", () => {
    const prisma = {
        reserva: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        evento: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        inscripcionEvento: {
            findMany: vi.fn(),
        },
    };

    return { prisma };
});

import { app } from "../app";
import { prisma } from "../db/prisma.js";
import { JWT_SECRET } from "../config/jwt.js";

const mockedPrisma = prisma as any;

function makeToken(payload: Record<string, unknown>) {
    return jwt.sign(payload, JWT_SECRET);
}

describe("Privacy data minimization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("GET /api/reservas devuelve solo datos minimizados de persona", async () => {
        mockedPrisma.reserva.findMany.mockResolvedValue([
            {
                id: "res-1",
                usuarioId: "user-1",
                espacioId: "esp-1",
                inicio: new Date("2026-04-08T10:00:00.000Z"),
                fin: new Date("2026-04-08T11:00:00.000Z"),
                estado: "CONFIRMADA",
                User: {
                    id: "user-1",
                    name: "Ana Perez",
                    email: "ana@example.com",
                    phone: "+34000000000",
                },
                Espacio: {
                    id: "esp-1",
                    nombre: "Comedor",
                },
            },
        ]);

        const res = await request(app).get("/api/reservas");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({
            id: "res-1",
            usuarioId: "user-1",
            espacioId: "esp-1",
            estado: "CONFIRMADA",
            usuario: { id: "user-1", name: "Ana Perez" },
            espacio: { id: "esp-1", nombre: "Comedor" },
        });

        expect(res.body[0].usuario.email).toBeUndefined();
        expect(res.body[0].usuario.phone).toBeUndefined();
        expect(res.body[0].User).toBeUndefined();
        expect(res.body[0].Espacio).toBeUndefined();
    });

    it("GET /api/eventos no expone inscripciones internas", async () => {
        mockedPrisma.evento.findMany.mockResolvedValue([
            {
                id: "ev-1",
                titulo: "Asamblea",
                fecha: new Date("2026-05-10T10:00:00.000Z"),
                lugar: "Local",
                aforo: 100,
                estado: "PUBLICADO",
                descripcion: "Reunion anual",
                Inscripciones: [
                    { asistentes: 2, userId: "user-1" },
                    { asistentes: 1, userId: "user-2" },
                ],
            },
        ]);

        const res = await request(app).get("/api/eventos");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({
            id: "ev-1",
            titulo: "Asamblea",
            apuntados: 3,
            isJoined: false,
        });

        expect(res.body[0].Inscripciones).toBeUndefined();
    });

    it("GET /api/eventos/:id/apuntados devuelve solo nombre y asistentes", async () => {
        mockedPrisma.evento.findUnique.mockResolvedValue({ id: "ev-1" });
        mockedPrisma.inscripcionEvento.findMany.mockResolvedValue([
            {
                eventId: "ev-1",
                userId: "user-1",
                asistentes: 2,
                User: {
                    id: "user-1",
                    name: "Hector",
                    email: "hector@example.com",
                    phone: "600000001",
                },
            },
            {
                eventId: "ev-1",
                userId: "user-2",
                asistentes: 1,
                User: {
                    id: "user-2",
                    name: "Laura",
                    email: "laura@example.com",
                    phone: "600000002",
                },
            },
        ]);

        const token = makeToken({
            sub: "user-3",
            role: "SOCIO",
            email: "viewer@example.com",
            name: "Viewer",
        });

        const res = await request(app)
            .get("/api/eventos/ev-1/apuntados")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { userId: "user-1", name: "Hector", asistentes: 2 },
            { userId: "user-2", name: "Laura", asistentes: 1 },
        ]);
    });

    it("PATCH /api/reservas/:id bloquea cambios de usuarios no propietarios", async () => {
        mockedPrisma.reserva.findUnique.mockImplementation(async () => ({
            id: "res-1",
            usuarioId: "owner-1",
        }));

        const token = makeToken({
            sub: "other-user",
            role: "SOCIO",
            email: "other@example.com",
            name: "Otro Usuario",
        });

        const res = await request(app)
            .patch("/api/reservas/res-1")
            .set("Authorization", `Bearer ${token}`)
            .send({ estado: "CANCELADA" });

        expect([403, 404]).toContain(res.status);
        expect(mockedPrisma.reserva.findUnique).toHaveBeenCalled();
        expect(mockedPrisma.reserva.update).not.toHaveBeenCalled();
    });

    it("PATCH /api/reservas/:id requiere token", async () => {
        const res = await request(app)
            .patch("/api/reservas/res-1")
            .send({ estado: "CANCELADA" });

        expect(res.status).toBe(401);
    });
});
