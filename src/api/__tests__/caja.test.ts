import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCajaProducts } from "../caja";
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
