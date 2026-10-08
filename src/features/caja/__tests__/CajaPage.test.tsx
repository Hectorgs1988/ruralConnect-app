import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import appRouter from "@/routes";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";

const mockListCajaProducts = vi.hoisted(() => vi.fn());
const mockAuth = vi.hoisted(() => ({
    state: {
        user: null as null | { id: string; name: string; email: string; role: "ADMIN" | "SOCIO" },
        token: null as string | null,
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
        mockAuth.state.user = null;
        mockAuth.state.token = null;
    });

    it("loads the public catalog anonymously and renders products without Rural Connect navigation", async () => {
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
        expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
        for (const privateLink of ["Inicio", "Eventos", "Reservas", "Compartir coche", "Despensa", "Administración"]) {
            expect(screen.queryByRole("link", { name: privateLink })).not.toBeInTheDocument();
        }
        expect(mockListCajaProducts).toHaveBeenCalledWith();
    });

    it.each(["/inicio", "/GestionCajaProductos"])(
        "keeps anonymous users out of protected route %s",
        async (path) => {
            const router = createMemoryRouter(appRouter.routes, { initialEntries: [path] });
            render(<RouterProvider router={router} />);

            await waitFor(() => expect(router.state.location.pathname).toBe("/"));
        },
    );

    it("does not require or display a Rural Connect user session", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("agua", "Agua", "BEBIDA", 100)]);

        renderCaja();

        expect(await screen.findByRole("button", { name: "Añadir Agua a la comanda" }))
            .toBeInTheDocument();
        expect(screen.queryByText(/Sesión iniciada como/)).not.toBeInTheDocument();
    });

    it("shows a loading state while the public catalog request is pending", async () => {
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

        expect(screen.getByLabelText("Cantidad seleccionada de Refresco")).toHaveTextContent("×2");
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("2 artículos");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,38\s*€/);
        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Refresco" }));
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("1 artículo");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,19\s*€/);
        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Refresco" }));
        expect(screen.queryByLabelText("Cantidad seleccionada de Refresco")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Añadir Refresco a la comanda" })).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("0 artículos");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,00\s*€/);
    });

    it("keeps long product names in accessible compact product cards", async () => {
        const longName = "Bocadillo especial de la casa con ingredientes variados";
        mockListCajaProducts.mockResolvedValue([makeProduct("bocadillo", longName, "COMIDA", 450)]);

        renderCaja();

        const product = await screen.findByRole("button", { name: `Añadir ${longName} a la comanda` });
        expect(product).toBeInTheDocument();
        expect(product).toHaveTextContent(longName);
        fireEvent.click(product);
        expect(screen.getByLabelText(`Cantidad seleccionada de ${longName}`)).toHaveTextContent("×1");
        fireEvent.click(screen.getByRole("button", { name: `Restar una unidad de ${longName}` }));
        expect(screen.getByRole("button", { name: `Añadir ${longName} a la comanda` })).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("0 artículos");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,00\s*€/);
    });

    it("opens checkout without completing and decrementing one to zero removes the ticket row", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco-id", "Refresco", "BEBIDA", 100),
        ]);

        renderCaja();

        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        expect(screen.getByRole("dialog", { name: "Cobrar" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirmar ticket" })).toBeDisabled();
        expect(screen.queryByRole("button", { name: /Quitar .* de la comanda/ })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Sumar una unidad de Refresco a 1,00 €" }));
        expect(screen.getByLabelText("Cantidad de Refresco")).toHaveTextContent("2");

        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Refresco a 1,00 €" }));
        expect(screen.getByLabelText("Cantidad de Refresco")).toHaveTextContent("1");
        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Refresco a 1,00 €" }));
        expect(screen.getByText("Aún no hay productos en la comanda.")).toBeInTheDocument();
        expect(screen.getByLabelText("Total revisado")).toHaveTextContent(/0,00\s*€/);
        expect(screen.queryByRole("button", { name: /Quitar .* de la comanda/ })).not.toBeInTheDocument();
    });

    it("disables Cobrar when empty and cancellation preserves the ticket", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco-id", "Refresco", "BEBIDA", 100),
        ]);

        renderCaja();
        const openButton = await screen.findByRole("button", { name: "Cobrar" });
        expect(openButton).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(openButton);
        fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
        fireEvent.click(screen.getByRole("button", { name: "Volver" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("1 artículo");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/1,00\s*€/);
        expect(screen.getByRole("button", { name: "Cobrar" })).toHaveFocus();
    });

    it("clears the ticket locally from checkout review", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 125)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Vaciar" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("0 artículos");
        expect(screen.getByLabelText("Total de la comanda")).toHaveTextContent(/0,00\s*€/);
    });

    it("shows existing voucher guidance and does not complete until explicitly confirmed", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("producto", "Producto", "COMIDA", 125),
        ]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Vale 24 EUR" }));

        expect(screen.getByRole("button", { name: "Vale 24 EUR" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText((_, element) =>
            element?.tagName === "P"
            && element.textContent?.replace(/\s+/g, " ").trim()
                === "Total: 1,25 EUR - Tacha 4 de 30 + 1 de 5.",
        )).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Vale 12 EUR" }));
        expect(screen.getByRole("button", { name: "Vale 12 EUR" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText((_, element) =>
            element?.tagName === "P"
            && element.textContent?.replace(/\s+/g, " ").trim()
                === "Total: 1,25 EUR - Tacha 1 fila + 1 de 5.",
        )).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirmar ticket" })).toBeEnabled();
        expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("1 artículo");
    });

    it("scrolls only the checkout content to cash and voucher details", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 1830)]);
        const pageScroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));

        const checkoutContent = document.querySelector<HTMLElement>(".caja-checkout-content");
        expect(checkoutContent).not.toBeNull();
        const contentScroll = vi.fn();
        Object.defineProperty(checkoutContent, "scrollTo", { configurable: true, value: contentScroll });

        try {
            fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
            await waitFor(() => expect(contentScroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" })));
            expect(screen.getByRole("region", { name: "Pago en efectivo" })).toBeVisible();
            expect(pageScroll).not.toHaveBeenCalled();

            contentScroll.mockClear();
            fireEvent.click(screen.getByRole("button", { name: "Vale 24 EUR" }));
            await waitFor(() => expect(contentScroll).toHaveBeenCalled());
            expect(screen.getByText(/Tacha/)).toBeVisible();
            expect(screen.getByRole("button", { name: "Efectivo" })).toBeVisible();
            expect(pageScroll).not.toHaveBeenCalled();
        } finally {
            pageScroll.mockRestore();
        }
    });

    it("scrolls to change after a preset or first valid custom amount without scrolling the page", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 1830)]);
        const pageScroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));

        const checkoutContent = document.querySelector<HTMLElement>(".caja-checkout-content");
        expect(checkoutContent).not.toBeNull();
        const contentScroll = vi.fn();
        Object.defineProperty(checkoutContent, "scrollTo", { configurable: true, value: contentScroll });

        try {
            await waitFor(() => expect(contentScroll).toHaveBeenCalled());
            contentScroll.mockClear();
            fireEvent.click(screen.getByRole("button", { name: "19,00 €" }));
            await waitFor(() => expect(contentScroll).toHaveBeenCalled());
            expect(screen.getByLabelText("Cambio")).toBeVisible();

            contentScroll.mockClear();
            const cashInput = screen.getByLabelText("Otro importe");
            fireEvent.change(cashInput, { target: { value: "18,00" } });
            expect(contentScroll).not.toHaveBeenCalled();
            fireEvent.change(cashInput, { target: { value: "18,50" } });
            await waitFor(() => expect(contentScroll).toHaveBeenCalled());
            expect(screen.getByLabelText("Cambio")).toHaveTextContent(/0,20\s*€/);
            expect(pageScroll).not.toHaveBeenCalled();
        } finally {
            pageScroll.mockRestore();
        }
    });

    it("offers adaptive cash presets, exact cash and prominent change", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 1830)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
        expect(screen.getByRole("button", { name: "19,00 €" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "20,00 €" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "50,00 €" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirmar ticket" })).toBeDisabled();

        fireEvent.change(screen.getByLabelText("Otro importe"), { target: { value: "18,30" } });
        expect(screen.getByLabelText("Cambio")).toHaveTextContent(/0,00\s*€/);
        expect(screen.getByRole("button", { name: "Confirmar ticket" })).toBeEnabled();
        fireEvent.change(screen.getByLabelText("Otro importe"), { target: { value: "18.50" } });
        expect(screen.getByLabelText("Cambio")).toHaveTextContent(/0,20\s*€/);
    });

    it("rejects cash underpayment and malformed custom amounts", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 1830)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
        fireEvent.change(screen.getByLabelText("Otro importe"), { target: { value: "18,00" } });
        expect(screen.getByRole("alert")).toHaveTextContent("no alcanza el total");
        expect(screen.getByRole("button", { name: "Confirmar ticket" })).toBeDisabled();
        fireEvent.change(screen.getByLabelText("Otro importe"), { target: { value: "1.234" } });
        expect(screen.getByRole("alert")).toHaveTextContent("máximo de dos decimales");
        expect(screen.getByRole("button", { name: "Confirmar ticket" })).toBeDisabled();
    });

    it("sets the received amount from a quick preset and calculates change", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 1830)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
        fireEvent.click(screen.getByRole("button", { name: "19,00 €" }));

        expect(screen.getByText((_, element) =>
            element?.tagName === "P"
            && element.textContent?.replace(/\s+/g, " ").trim() === "Importe recibido: 19,00 €",
        )).toBeInTheDocument();
        expect(screen.getByLabelText("Cambio")).toHaveTextContent(/0,70\s*€/);
    });

    it("disables Cobrar when empty", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 125)]);

        renderCaja();
        expect(await screen.findByRole("button", { name: "Cobrar" })).toBeDisabled();
    });

    it("resets transient payment state when changing methods or cancelling checkout", async () => {
        mockListCajaProducts.mockResolvedValue([makeProduct("producto", "Producto", "COMIDA", 125)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Producto a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
        fireEvent.change(screen.getByLabelText("Otro importe"), { target: { value: "2,00" } });
        fireEvent.click(screen.getByRole("button", { name: "Vale 12 EUR" }));
        expect(screen.queryByLabelText("Otro importe")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Volver" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        expect(screen.queryByLabelText("Otro importe")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Vale 24 EUR" })).toHaveAttribute("aria-pressed", "false");
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
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        expect(screen.getByText("Refresco antiguo")).toBeInTheDocument();
        expect(screen.getByLabelText("Total revisado")).toHaveTextContent(/0,19\s*€/);
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
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));

        expect(screen.getAllByLabelText("Cantidad de Cerveza")).toHaveLength(2);
        expect(screen.getAllByLabelText("Cantidad de Cerveza").map((node) => node.textContent))
            .toEqual(["2", "1"]);
        expect(screen.getByText(/1,50\s*€ × 2 = 3,00\s*€/)).toBeInTheDocument();
        expect(screen.getByText(/1,80\s*€ × 1 = 1,80\s*€/)).toBeInTheDocument();
        expect(screen.getByLabelText("Cantidad seleccionada de Cerveza")).toHaveTextContent("×3");
        expect(screen.getByLabelText("Número de artículos en revisión")).toHaveTextContent("3 artículos");
        expect(screen.getByLabelText("Total revisado")).toHaveTextContent(/4,80\s*€/);
    });

    it("calculates voucher guidance from snapshotted ticket prices after catalog refresh", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 150)])
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 180)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Vale 24 EUR" }));

        expect(screen.getByLabelText("Total revisado")).toHaveTextContent(/3,30\s*€/);
        expect(screen.getByText((_, element) =>
            element?.tagName === "P"
            && element.textContent?.replace("•", "").replace(/\s+/g, " ").trim()
                === "Total: 3,30 EUR - Tacha 2 filas + 1 de 30.",
        )).toBeInTheDocument();
    });

    it("routes checkout quantity controls to the matching price-snapshot line", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 150)])
            .mockResolvedValueOnce([makeProduct("cerveza-id", "Cerveza", "BEBIDA", 180)]);

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Cerveza a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Sumar una unidad de Cerveza a 1,50 €" }));

        expect(screen.getAllByLabelText("Cantidad de Cerveza").map((node) => node.textContent))
            .toEqual(["2", "1"]);

        expect(screen.queryByRole("button", { name: /Quitar .* de la comanda/ })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Cerveza a 1,50 €" }));
        expect(screen.getAllByLabelText("Cantidad de Cerveza").map((node) => node.textContent))
            .toEqual(["1", "1"]);
        fireEvent.click(screen.getByRole("button", { name: "Restar una unidad de Cerveza a 1,50 €" }));
        expect(screen.getAllByLabelText("Cantidad de Cerveza").map((node) => node.textContent))
            .toEqual(["1"]);
        expect(screen.getByLabelText("Total revisado")).toHaveTextContent(/1,80\s*€/);
    });

    it("shows temporary completion feedback and clears the ticket without writing persistence", async () => {
        mockListCajaProducts.mockResolvedValue([
            makeProduct("refresco-id", "Refresco", "BEBIDA", 180),
        ]);
        const storageWrite = vi.spyOn(Storage.prototype, "setItem");

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
        fireEvent.change(screen.getByLabelText("Otro importe"), { target: { value: "2,00" } });
        vi.useFakeTimers();
        try {
            fireEvent.click(screen.getByRole("button", { name: "Confirmar ticket" }));

            expect(screen.getByRole("status")).toHaveTextContent("Ticket completado");
            expect(screen.getByRole("status")).not.toHaveTextContent(/No se ha guardado|pedido|pago/i);
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("0 artículos");
            expect(storageWrite).not.toHaveBeenCalled();
            expect(mockListCajaProducts).toHaveBeenCalledTimes(1);
            await act(async () => {
                vi.advanceTimersByTime(2500);
            });
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
            fireEvent.click(screen.getByRole("button", { name: "Añadir Refresco a la comanda" }));
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
            expect(screen.getByLabelText("Número de artículos")).toHaveTextContent("1 artículo");
        } finally {
            storageWrite.mockRestore();
            vi.useRealTimers();
        }
    });

    it("keeps the ticket while showing a catalog refresh error", async () => {
        mockListCajaProducts
            .mockResolvedValueOnce([makeProduct("refresco-id", "Refresco", "BEBIDA", 180)])
            .mockRejectedValueOnce(new Error("Error de actualización"));

        renderCaja();
        fireEvent.click(await screen.findByRole("button", { name: "Añadir Refresco a la comanda" }));
        fireEvent.click(screen.getByRole("button", { name: "Actualizar catálogo" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Error de actualización");
        fireEvent.click(screen.getByRole("button", { name: "Cobrar" }));
        expect(screen.getByLabelText("Cantidad de Refresco")).toHaveTextContent("1");
        expect(screen.getByLabelText("Total revisado")).toHaveTextContent(/1,80\s*€/);
    });
});
