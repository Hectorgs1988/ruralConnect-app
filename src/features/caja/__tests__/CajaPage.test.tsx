import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

    it("adds API products to the ticket and increments repeated selections by stable product ID", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco-id", "Refresco", "BEBIDA", 19),
        ]);

        renderCaja();

        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Añadir Refresco a la comanda" }));

        expect(screen.getByLabelText("Cantidad de Refresco")).toHaveTextContent("2");
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("2 artículos");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,38\s*€/);
    });

    it("increments and decrements a line, removing it when quantity reaches zero", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco-id", "Refresco", "BEBIDA", 100),
        ]);

        renderCaja();

        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Sumar una unidad de Refresco a 1,00 €" }));
        expect(screen.getByLabelText("Cantidad de Refresco")).toHaveTextContent("2");

        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Refresco a 1,00 €" }));
        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Refresco a 1,00 €" }));
        expect(screen.queryByLabelText("Cantidad de Refresco")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("0 artículos");
    });

    it("clears the current ticket", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco-id", "Refresco", "BEBIDA", 100),
            makeProduct("bocadillo-id", "Bocadillo", "COMIDA", 250),
        ]);

        renderCaja();

        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Añadir Bocadillo a la comanda" }));

        fireEvent.click(screen.getByRole("button", { name: "Vaciar" }));
        expect(screen.getByText("Aún no hay productos en la comanda.")).toBeInTheDocument();
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,00\s*€/);
    });

    it("shows voucher guidance with the legacy default and switches voucher type", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("producto", "Producto", "COMIDA", 125),
        ]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Pagar con vale" }));

        expect(screen.getByRole("button", { name: "Vale 24 EUR" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText((_, element) =>
            element?.tagName === "P"
            && element.textContent?.replace("•", "").replace(/\s+/g, " ").trim()
                === "Total: 1,25 EUR - Tacha 4 de 30 + 1 de 5.",
        )).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Vale 12 EUR" }));
        expect(screen.getByRole("button", { name: "Vale 12 EUR" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText((_, element) =>
            element?.tagName === "P"
            && element.textContent?.replace("•", "").replace(/\s+/g, " ").trim()
                === "Total: 1,25 EUR - Tacha 1 fila + 1 de 5.",
        )).toBeInTheDocument();
    });

    it("keeps voucher guidance hidden when the ticket total is zero", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 125)]);

        renderCaja();

        expect(await screen.findByRole("button", { name: "Pagar con vale" })).toBeDisabled();
        expect(screen.queryByRole("group", { name: "Tipo de vale" })).not.toBeInTheDocument();
    });

    it("turns voucher mode off on clear while retaining the selected voucher type", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 125)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Pagar con vale" }));
        fireEvent.click(screen.getByRole("button", { name: "Vale 12 EUR" }));
        fireEvent.click(screen.getByRole("button", { name: "Vaciar" }));

        expect(screen.queryByRole("group", { name: "Tipo de vale" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Pagar con vale" })).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(screen.getByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Pagar con vale" }));
        expect(screen.getByRole("button", { name: "Vale 12 EUR" })).toHaveAttribute("aria-pressed", "true");
    });

    it("turns voucher mode off when completing the ticket", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 125)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Pagar con vale" }));
        fireEvent.click(screen.getByRole("button", { name: "Completar ticket" }));

        expect(await screen.findByRole("status")).toHaveTextContent("Ticket completado");
        expect(screen.queryByRole("group", { name: "Tipo de vale" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Pagar con vale" })).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps an in-progress line snapshot unchanged when the API catalog refreshes", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("refresco-id", "Refresco antiguo", "BEBIDA", 19)])
            .mockResolvedValueOnce([makeProduct("refresco-id", "Refresco actualizado", "BEBIDA", 999)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco antiguo a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));

        expect(await screen.findByRole("button", { name: "Añadir Refresco actualizado a la comanda" }))
            .toBeInTheDocument();
        expect(screen.getByText("Refresco antiguo")).toBeInTheDocument();
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,19\s*€/);
        expect(mockListCajaProducts).toHaveBeenCalledTimes(2);
    });

    it("aggregates the catalog quantity indicator across refreshed-price ticket lines", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 150)])
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 180)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));

        expect(screen.getAllByLabelText("Cantidad de Cerveza")).toHaveLength(2);
        expect(screen.getAllByLabelText("Cantidad de Cerveza").map((node) => node.textContent))
            .toEqual(["2", "1"]);
        expect(screen.getByText(/2 × 1,50\s*€ = 3,00\s*€/)).toBeInTheDocument();
        expect(screen.getByText(/1 × 1,80\s*€ = 1,80\s*€/)).toBeInTheDocument();
        expect(screen.getByText("×3")).toBeInTheDocument();
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("3 artículos");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/4,80\s*€/);
    });

    it("calculates voucher guidance from snapshotted ticket prices after catalog refresh", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 150)])
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 180)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Pagar con vale" }));

        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/3,30\s*€/);
        expect(screen.getByText((_, element) =>
            element?.tagName === "P"
            && element.textContent?.replace("•", "").replace(/\s+/g, " ").trim()
                === "Total: 3,30 EUR - Tacha 2 filas + 1 de 30.",
        )).toBeInTheDocument();
    });

    it("routes UI quantity and remove controls to the matching price-snapshot line", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 150)])
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 180)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Sumar una unidad de Cerveza a 1,50 €" }));

        expect(screen.getAllByLabelText("Cantidad de Cerveza").map((node) => node.textContent))
            .toEqual(["2", "1"]);

        fireEvent.click(screen.getByRole("button", { name: "Quitar Cerveza a 1,80 € de la comanda" }));
        expect(screen.getAllByLabelText("Cantidad de Cerveza").map((node) => node.textContent))
            .toEqual(["2"]);
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/3,00\s*€/);
    });

    it("completes the ticket locally without writing an order to local storage", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco-id", "Refresco", "BEBIDA", 180),
        ]);
        const storageWrite = vi.spyOn(Storage.prototype, "setItem");

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Completar ticket" }));

        expect(await screen.findByRole("status")).toHaveTextContent("Ticket completado: 1,80");
        expect(screen.getByText("Aún no hay productos en la comanda.")).toBeInTheDocument();
        expect(storageWrite).not.toHaveBeenCalled();
        expect(mockListCajaProducts).toHaveBeenCalledTimes(1);
        storageWrite.mockRestore();
    });

    it("keeps the ticket while showing a catalog refresh error", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("refresco-id", "Refresco", "BEBIDA", 180)])
            .mockRejectedValueOnce(new Error("Error de actualización"));

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Error de actualización");
        expect(screen.getByLabelText("Cantidad de Refresco")).toHaveTextContent("1");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/1,80\s*€/);
    });
});
