import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createCajaProduct,
    deactivateCajaProduct,
    listAdminCajaProducts,
    listCajaProducts,
    reactivateCajaProduct,
    updateCajaProduct,
} from "../caja";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";

const { mockApiFetch, mockGetErrorMessage } = vi.hoisted(() => ({
    mockApiFetch: vi.fn(),
    mockGetErrorMessage: vi.fn(),
}));

vi.mock("@/api/client", () => ({
    apiFetch: mockApiFetch,
    getErrorMessage: mockGetErrorMessage,
}));

const product: CajaProduct = {
    id: "refresco",
    name: "Refresco",
    category: "BEBIDA",
    priceCents: 180,
    active: true,
    createdAt: "2026-10-07T10:00:00.000Z",
    updatedAt: "2026-10-07T11:00:00.000Z",
};

describe("listCajaProducts", () => {
    beforeEach(() => {
        mockApiFetch.mockReset();
        mockGetErrorMessage.mockReset();
    });

    describe("Caja admin API", () => {
        beforeEach(() => {
            mockApiFetch.mockReset();
            mockGetErrorMessage.mockReset();
        });

        it("lists all admin products from the protected endpoint", async () => {
            mockApiFetch.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([product, { ...product, id: "inactiva", active: false }]),
            });

            await expect(listAdminCajaProducts("admin-token")).resolves.toHaveLength(2);
            expect(mockApiFetch).toHaveBeenCalledWith("/api/caja/admin/products", {
                headers: { Authorization: "Bearer admin-token" },
            });
        });

        it("creates products with integer-cent payloads", async () => {
            mockApiFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(product) });
            const payload = {
                id: product.id,
                name: product.name,
                category: product.category,
                priceCents: product.priceCents,
            };

            await expect(createCajaProduct("admin-token", payload)).resolves.toEqual(product);
            expect(mockApiFetch).toHaveBeenCalledWith("/api/caja/products", {
                method: "POST",
                headers: {
                    Authorization: "Bearer admin-token",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
        });

        it("edits products by immutable ID using the mutable fields only", async () => {
            mockApiFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(product) });
            const payload = { name: "Nuevo nombre", category: "COMIDA" as const, priceCents: 250 };

            await expect(updateCajaProduct("admin-token", "id/con segmento", payload))
                .resolves.toEqual(product);
            expect(mockApiFetch).toHaveBeenCalledWith(
                "/api/caja/products/id%2Fcon%20segmento",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify(payload),
                }),
            );
        });

        it("uses the soft-deactivation endpoint and surfaces API errors", async () => {
            mockApiFetch.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({ ...product, active: false }),
            });
            await expect(deactivateCajaProduct("admin-token", product.id))
                .resolves.toMatchObject({ active: false });
            expect(mockApiFetch).toHaveBeenCalledWith(
                "/api/caja/products/refresco/deactivate",
                { method: "PATCH", headers: { Authorization: "Bearer admin-token" } },
            );

            mockApiFetch.mockResolvedValueOnce({ ok: false, status: 403 });
            mockGetErrorMessage.mockResolvedValue("No autorizado");
            await expect(listAdminCajaProducts("admin-token")).rejects.toThrow("No autorizado");
        });

        it("uses the authenticated reactivation endpoint and surfaces API errors", async () => {
            mockApiFetch.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({ ...product, active: true }),
            });

            await expect(reactivateCajaProduct("admin-token", product.id))
                .resolves.toMatchObject({ id: product.id, active: true });
            expect(mockApiFetch).toHaveBeenCalledWith(
                "/api/caja/products/refresco/reactivate",
                { method: "PATCH", headers: { Authorization: "Bearer admin-token" } },
            );

            mockApiFetch.mockResolvedValueOnce({ ok: false, status: 404 });
            mockGetErrorMessage.mockResolvedValue("Producto no encontrado");
            await expect(reactivateCajaProduct("admin-token", product.id))
                .rejects.toThrow("Producto no encontrado");
        });
    });

    it("requests the shared Caja endpoint with the Rural Connect bearer token", async () => {
        mockApiFetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([product]),
        });

        await expect(listCajaProducts("rural-token")).resolves.toEqual([product]);

        expect(mockApiFetch).toHaveBeenCalledWith("/api/caja/products", {
            headers: { Authorization: "Bearer rural-token" },
        });
    });

    it("surfaces API errors instead of treating them as an empty catalog", async () => {
        mockApiFetch.mockResolvedValue({ ok: false, status: 503 });
        mockGetErrorMessage.mockResolvedValue("Catalog service unavailable");

        await expect(listCajaProducts("rural-token")).rejects.toThrow(
            "Catalog service unavailable",
        );
    });
});
