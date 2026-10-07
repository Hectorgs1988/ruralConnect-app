import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import appRouter from "@/routes";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";

const mockListCajaProducts = vi.hoisted(() => vi.fn());
const mockAuth = vi.hoisted(() => ({
    state: {
        user: {
            id: "user-1",
            name: "Rural User",
            email: "user@example.com",
            role: "SOCIO" as const,
        },
        token: "rural-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
    },
}));

vi.mock("@/api/caja", () => ({
    listCajaProducts: mockListCajaProducts,
}));

vi.mock("@/context/AuthContext", () => ({
    useAuth: () => mockAuth.state,
}));

function makeProduct(
    id: string,
    name: string,
    category: CajaProduct["category"],
    priceCents: number,
): CajaProduct {
    return {
        id,
        name,
        category,
        priceCents,
        active: true,
        createdAt: "2026-10-07T10:00:00.000Z",
        updatedAt: "2026-10-07T11:00:00.000Z",
    };
}

function renderCaja() {
    const router = createMemoryRouter(appRouter.routes, { initialEntries: ["/caja"] });
    render(<RouterProvider router={router} />);
}

describe("Caja product catalog", () => {
    beforeEach(() => {
        mockListCajaProducts.mockReset();
        mockAuth.state.token = "rural-token";
    });

    it("loads and renders API products by category with integer-cent prices", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco", "Refresco", "BEBIDA", 180),
            makeProduct("fideua", "Fideuá", "COMIDA", 450),
        ]);

        renderCaja();

        expect(await screen.findByRole("heading", { name: "Bebida" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Comida" })).toBeInTheDocument();
        expect(screen.getByText("Refresco")).toBeInTheDocument();
        expect(screen.getByText("Fideuá")).toBeInTheDocument();
        expect(screen.getByText(/1,80\s*€/)).toBeInTheDocument();
        expect(screen.getByText(/4,50\s*€/)).toBeInTheDocument();
        expect(mockListCajaProducts).toHaveBeenCalledWith("rural-token");
    });

    it("shows a loading state while the authenticated catalog request is pending", async () => {
        let resolveCatalog!: (products: CajaProduct[]) => void;
        mockListCajaProducts.mockReturnValue(new Promise((resolve) => {
            resolveCatalog = resolve;
        }));

        renderCaja();

        expect(screen.getByRole("status")).toHaveTextContent("Cargando productos...");
        resolveCatalog([makeProduct("agua", "Agua", "BEBIDA", 100)]);
        expect(await screen.findByText("Agua")).toBeInTheDocument();
    });

    it("shows an empty-catalog state for an empty API response", async () => {
        mockListCajaProducts.mockResolvedValue([]);

        renderCaja();

        expect(await screen.findByText("No hay productos disponibles.")).toBeInTheDocument();
    });

    it("shows the API error and does not fall back to static products", async () => {
        mockListCajaProducts.mockRejectedValue(new Error("Catálogo no disponible"));

        renderCaja();

        expect(await screen.findByRole("alert")).toHaveTextContent("Catálogo no disponible");
        expect(screen.queryByText("Cerveza")).not.toBeInTheDocument();
        expect(screen.queryByText("Refresco")).not.toBeInTheDocument();
    });
});
