import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import appRouter from "@/routes";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import { MAX_CAJA_PRICE_CENTS, validateCajaProductForm } from "../productForm";

const mockCajaApi = vi.hoisted(() => ({
    listAdminCajaProducts: vi.fn(),
    listCajaProducts: vi.fn(),
    createCajaProduct: vi.fn(),
    updateCajaProduct: vi.fn(),
    deactivateCajaProduct: vi.fn(),
    reactivateCajaProduct: vi.fn(),
    deleteCajaProduct: vi.fn(),
}));
const mockAuth = vi.hoisted(() => ({
    state: {
        user: {
            id: "admin-1",
            name: "Rural Admin",
            email: "admin@example.com",
            role: "ADMIN" as "ADMIN" | "SOCIO",
        },
        token: "rural-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
    },
}));

vi.mock("@/api/caja", () => ({
    ...mockCajaApi,
}));

vi.mock("@/context/AuthContext", () => ({
    useAuth: () => mockAuth.state,
}));

const product: CajaProduct = {
    id: "cerveza",
    name: "Cerveza",
    category: "BEBIDA",
    priceCents: 150,
    active: true,
    createdAt: "2026-10-07T10:00:00.000Z",
    updatedAt: "2026-10-07T11:00:00.000Z",
};

function renderAdminPage() {
    const router = createMemoryRouter(appRouter.routes, {
        initialEntries: ["/GestionCajaProductos"],
    });
    render(<RouterProvider router={router} />);
}

describe("Caja product administration UI", () => {
    beforeEach(() => {
        mockAuth.state.user.role = "ADMIN";
        Object.values(mockCajaApi).forEach((mock) => mock.mockReset());
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([product]);
    });

    it("allows ADMIN users to access the page and displays product administration data", async () => {
        renderAdminPage();

        expect(await screen.findByRole("heading", { name: "Gestión de productos de Caja" }))
            .toBeInTheDocument();
        expect(screen.getByText("cerveza")).toBeInTheDocument();
        expect(screen.getByText("Cerveza")).toBeInTheDocument();
        expect(screen.getByText("Bebida")).toBeInTheDocument();
        expect(screen.getByText(/1,50\s*€/)).toBeInTheDocument();
        expect(screen.getByText("Activo")).toBeInTheDocument();
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledWith("rural-token");
    });

    it("uses responsive product cards without a horizontally scrolling table", async () => {
        renderAdminPage();

        const card = await screen.findByRole("article");
        expect(card).toHaveTextContent("Cerveza");
        expect(card).toHaveTextContent("Bebida");
        expect(card).toHaveTextContent(/1,50\s*€/);
        expect(card).toHaveTextContent("Activo");
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
        expect(document.querySelector(".overflow-x-auto")).not.toBeInTheDocument();
    });

    it("filters products by name and active status on the client", async () => {
        const inactiveProduct = {
            ...product,
            id: "agua",
            name: "Agua con gas",
            category: "COMIDA" as const,
            active: false,
        };
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([product, inactiveProduct]);
        renderAdminPage();

        expect(await screen.findAllByRole("article")).toHaveLength(2);

        fireEvent.change(screen.getByRole("searchbox", { name: "Buscar por nombre" }), {
            target: { value: "AGUA" },
        });
        expect(screen.getAllByRole("article")).toHaveLength(1);
        expect(screen.getByText("Agua con gas")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "active" } });
        expect(screen.getByText(/No hay productos que coincidan/)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "inactive" } });
        expect(screen.getByRole("article")).toHaveTextContent("Agua con gas");

        fireEvent.change(screen.getByRole("searchbox", { name: "Buscar por nombre" }), {
            target: { value: "" },
        });
        fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "all" } });
        expect(screen.getAllByRole("article")).toHaveLength(2);
    });

    it("shows active and inactive products with reactivation available only for inactive products", async () => {
        const inactiveProduct = { ...product, id: "inactiva", name: "Producto inactivo", active: false };
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([product, inactiveProduct]);

        renderAdminPage();

        expect(await screen.findByText("Producto inactivo")).toBeInTheDocument();
        expect(screen.getAllByText("Inactivo")).toHaveLength(1);
        expect(screen.getByRole("button", { name: "Reactivar" })).toBeInTheDocument();
        expect(screen.queryByText(/reactivación no disponible/i)).not.toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Desactivar" })).toHaveLength(1);
    });

    it("denies non-admin users using the existing role guard", () => {
        mockAuth.state.user.role = "SOCIO";
        renderAdminPage();

        expect(screen.queryByRole("heading", { name: "Gestión de productos de Caja" }))
            .not.toBeInTheDocument();
        expect(mockCajaApi.listAdminCajaProducts).not.toHaveBeenCalled();
    });

    it("opens a creation form and validates required fields", async () => {
        renderAdminPage();

        const createButton = await screen.findByRole("button", { name: "Crear producto" });
        fireEvent.click(createButton);
        expect(screen.getByRole("heading", { name: "Crear producto" })).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
        expect(screen.getByLabelText("ID")).toHaveFocus();
        fireEvent.click(screen.getByRole("button", { name: "Guardar producto" }));

        expect(screen.getByText("El ID es obligatorio.")).toBeInTheDocument();
        expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
        expect(screen.getByText("Selecciona Bebida o Comida.")).toBeInTheDocument();
        expect(screen.getByText(/precio no negativo/i)).toBeInTheDocument();
    });

    it("opens the edit form with existing values and keeps the product ID read-only", async () => {
        renderAdminPage();

        const editButton = await screen.findByRole("button", { name: "Editar" });
        fireEvent.click(editButton);

        expect(screen.getByRole("heading", { name: "Editar Cerveza" })).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
        expect(screen.getByLabelText("ID")).toHaveFocus();
        expect(screen.getByLabelText("ID")).toHaveValue("cerveza");
        expect(screen.getByLabelText("ID")).toHaveAttribute("readonly");
        expect(screen.getByLabelText("Nombre")).toHaveValue("Cerveza");
        expect(screen.getByLabelText("Categoría")).toHaveValue("BEBIDA");
        expect(screen.getByLabelText("Precio (EUR)")).toHaveValue("1.50");
    });

    it("closes the form on Escape and restores focus to its trigger", async () => {
        renderAdminPage();
        const createButton = await screen.findByRole("button", { name: "Crear producto" });
        fireEvent.click(createButton);
        const appRoot = screen.getByRole("main").closest(".rc-page")?.parentElement;
        expect(appRoot).toHaveProperty("inert", true);

        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(appRoot).not.toHaveProperty("inert", true);
        expect(createButton).toHaveFocus();
    });

    it("cancels deactivation without mutating and restores focus to the action", async () => {
        renderAdminPage();
        const deactivateButton = await screen.findByRole("button", { name: "Desactivar" });
        fireEvent.click(deactivateButton);

        expect(screen.getByRole("heading", { name: "Desactivar «Cerveza»" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(mockCajaApi.deactivateCajaProduct).not.toHaveBeenCalled();
        expect(deactivateButton).toHaveFocus();
    });

    it("rejects an invalid category and a negative price", () => {
        const commonValues = {
            id: "nuevo",
            name: "Nuevo",
            category: "BEBIDA",
            priceEuros: "1.25",
        };
        const invalidCategory = validateCajaProductForm({
            ...commonValues,
            category: "BEBIDAS",
        }, "create");
        expect(invalidCategory.valid).toBe(false);
        if (!invalidCategory.valid) {
            expect(invalidCategory.errors.category).toBe("Selecciona Bebida o Comida.");
        }

        const negativePrice = validateCajaProductForm({
            ...commonValues,
            priceEuros: "-0.01",
        }, "create");
        expect(negativePrice.valid).toBe(false);
        if (!negativePrice.valid) {
            expect(negativePrice.errors.priceEuros).toMatch(/no negativo/);
        }
    });

    it("accepts prices up to the database integer maximum and rejects values above it", () => {
        const commonValues = {
            id: "precio",
            name: "Producto",
            category: "BEBIDA",
        };
        const maximumPrice = validateCajaProductForm({
            ...commonValues,
            priceEuros: "21474836.47",
        }, "create");
        expect(maximumPrice.valid).toBe(true);
        if (maximumPrice.valid) {
            expect(maximumPrice.draft.priceCents).toBe(MAX_CAJA_PRICE_CENTS);
        }

        const aboveMaximum = validateCajaProductForm({
            ...commonValues,
            priceEuros: "21474836.48",
        }, "create");
        expect(aboveMaximum.valid).toBe(false);
        if (!aboveMaximum.valid) {
            expect(aboveMaximum.errors.priceEuros).toMatch(/21\.474\.836,47/);
        }

        const normalPrice = validateCajaProductForm({
            ...commonValues,
            priceEuros: "1,50",
        }, "create");
        expect(normalPrice.valid).toBe(true);
        if (normalPrice.valid) {
            expect(normalPrice.draft.priceCents).toBe(150);
        }
    });

    it("matches the backend maximum length for product IDs and names", () => {
        const tooLongId = validateCajaProductForm({
            id: "i".repeat(192),
            name: "Producto",
            category: "BEBIDA",
            priceEuros: "1.00",
        }, "create");
        expect(tooLongId.valid).toBe(false);
        if (!tooLongId.valid) {
            expect(tooLongId.errors.id).toMatch(/191 caracteres/);
        }

        const tooLongName = validateCajaProductForm({
            id: "producto",
            name: "n".repeat(192),
            category: "BEBIDA",
            priceEuros: "1.00",
        }, "create");
        expect(tooLongName.valid).toBe(false);
        if (!tooLongName.valid) {
            expect(tooLongName.errors.name).toMatch(/191 caracteres/);
        }
    });

    it("creates a product using the integer-cent payload and refreshes the admin list", async () => {
        const created = { ...product, id: "nuevo", name: "Nuevo", category: "COMIDA" as const, priceCents: 125 };
        mockCajaApi.createCajaProduct.mockResolvedValue(created);
        mockCajaApi.listAdminCajaProducts
            .mockResolvedValueOnce([product])
            .mockResolvedValueOnce([product, created]);
        const validation = validateCajaProductForm({
            id: "nuevo",
            name: "Nuevo",
            category: "COMIDA",
            priceEuros: "1,25",
        }, "create");
        expect(validation.valid).toBe(true);
        if (validation.valid) expect(validation.draft.priceCents).toBe(125);

        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Crear producto" }));
        fireEvent.change(screen.getByLabelText("ID"), { target: { value: "nuevo" } });
        fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nuevo" } });
        fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "COMIDA" } });
        fireEvent.change(screen.getByLabelText("Precio (EUR)"), { target: { value: "1,25" } });
        fireEvent.click(screen.getByRole("button", { name: "Guardar producto" }));

        expect(await screen.findByRole("status"))
            .toHaveTextContent("Producto nuevo creado.");
        expect(mockCajaApi.createCajaProduct).toHaveBeenCalledWith("rural-token", {
            id: "nuevo", name: "Nuevo", category: "COMIDA", priceCents: 125,
        });
        expect(await screen.findByText("Nuevo")).toBeInTheDocument();
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(2);
    });

    it("shows create API errors without refreshing or adding the product", async () => {
        mockCajaApi.createCajaProduct.mockRejectedValue(new Error("El ID ya existe"));
        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Crear producto" }));
        fireEvent.change(screen.getByLabelText("ID"), { target: { value: "cerveza" } });
        fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Duplicado" } });
        fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "BEBIDA" } });
        fireEvent.change(screen.getByLabelText("Precio (EUR)"), { target: { value: "1,50" } });
        fireEvent.click(screen.getByRole("button", { name: "Guardar producto" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("El ID ya existe");
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(1);
    });

    it("edits a product and refreshes the list while keeping the ID immutable", async () => {
        const updated = { ...product, name: "Cerveza especial", priceCents: 200 };
        mockCajaApi.updateCajaProduct.mockResolvedValue(updated);
        mockCajaApi.listAdminCajaProducts
            .mockResolvedValueOnce([product])
            .mockResolvedValueOnce([updated]);
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
        fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Cerveza especial" } });
        fireEvent.change(screen.getByLabelText("Precio (EUR)"), { target: { value: "2,00" } });
        fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

        expect(await screen.findByRole("status")).toHaveTextContent("Producto cerveza actualizado.");
        expect(mockCajaApi.updateCajaProduct).toHaveBeenCalledWith("rural-token", "cerveza", {
            name: "Cerveza especial", category: "BEBIDA", priceCents: 200,
        });
        expect(await screen.findByText("Cerveza especial")).toBeInTheDocument();
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(2);
    });

    it("shows edit API errors and does not refresh the list", async () => {
        mockCajaApi.updateCajaProduct.mockRejectedValue(new Error("Producto no encontrado"));
        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
        fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Producto no encontrado");
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(1);
    });

    it("soft-deactivates products and refreshes them as inactive", async () => {
        const inactiveProduct = { ...product, active: false };
        mockCajaApi.deactivateCajaProduct.mockResolvedValue(inactiveProduct);
        mockCajaApi.listAdminCajaProducts
            .mockResolvedValueOnce([product])
            .mockResolvedValueOnce([inactiveProduct]);
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Desactivar" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirmar desactivación" }));

        expect(await screen.findByRole("status")).toHaveTextContent("Producto cerveza desactivado.");
        expect(mockCajaApi.deactivateCajaProduct).toHaveBeenCalledWith("rural-token", "cerveza");
        expect(await screen.findByText("Inactivo")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reactivar" })).toBeInTheDocument();
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(2);
    });

    it("shows deactivation API errors without refreshing", async () => {
        mockCajaApi.deactivateCajaProduct.mockRejectedValue(new Error("No autorizado"));
        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Desactivar" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirmar desactivación" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("No autorizado");
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(1);
    });

    it("confirms reactivation, calls the API, and refreshes the product as active", async () => {
        const inactiveProduct = { ...product, active: false };
        mockCajaApi.reactivateCajaProduct.mockResolvedValue(product);
        mockCajaApi.listAdminCajaProducts
            .mockResolvedValueOnce([inactiveProduct])
            .mockResolvedValueOnce([product]);
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Reactivar" }));
        expect(screen.getByRole("heading", { name: "Reactivar «Cerveza»" }))
            .toBeInTheDocument();
        expect(mockCajaApi.reactivateCajaProduct).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Confirmar reactivación" }));

        expect(await screen.findByText("Producto cerveza reactivado.")).toBeInTheDocument();
        expect(mockCajaApi.reactivateCajaProduct).toHaveBeenCalledWith("rural-token", "cerveza");
        expect(await screen.findByText("Activo")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Reactivar" })).not.toBeInTheDocument();
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(2);
    });

    it("allows cancelling the reactivation confirmation without an API request", async () => {
        const inactiveProduct = { ...product, active: false };
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([inactiveProduct]);
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Reactivar" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.queryByRole("heading", { name: "Reactivar «Cerveza»" }))
            .not.toBeInTheDocument();
        expect(mockCajaApi.reactivateCajaProduct).not.toHaveBeenCalled();
    });

    it("closes reactivation confirmation on Escape without mutating", async () => {
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([{ ...product, active: false }]);
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Reactivar" }));
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

        expect(mockCajaApi.reactivateCajaProduct).not.toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("shows reactivation API errors without refreshing", async () => {
        const inactiveProduct = { ...product, active: false };
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([inactiveProduct]);
        mockCajaApi.reactivateCajaProduct.mockRejectedValue(new Error("No autorizado"));
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Reactivar" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirmar reactivación" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("No autorizado");
        expect(mockCajaApi.listAdminCajaProducts).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: "Reactivar" })).toBeInTheDocument();
    });

    it("prevents duplicate reactivation submissions while the request is pending", async () => {
        const inactiveProduct = { ...product, active: false };
        let resolveReactivation!: (reactivated: CajaProduct) => void;
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([inactiveProduct]);
        mockCajaApi.reactivateCajaProduct.mockReturnValue(new Promise((resolve) => {
            resolveReactivation = resolve;
        }));
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Reactivar" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirmar reactivación" }));

        const pendingButton = screen.getByRole("button", { name: "Reactivando..." });
        expect(pendingButton).toBeDisabled();
        fireEvent.click(pendingButton);
        expect(mockCajaApi.reactivateCajaProduct).toHaveBeenCalledTimes(1);

        resolveReactivation(product);
        expect(await screen.findByText("Producto cerveza reactivado.")).toBeInTheDocument();
    });

    it("prevents duplicate create submissions while the request is pending", async () => {
        let resolveCreate!: (created: CajaProduct) => void;
        mockCajaApi.createCajaProduct.mockReturnValue(new Promise((resolve) => {
            resolveCreate = resolve;
        }));
        mockCajaApi.listAdminCajaProducts.mockResolvedValue([product]);
        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Crear producto" }));
        fireEvent.change(screen.getByLabelText("ID"), { target: { value: "nuevo" } });
        fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nuevo" } });
        fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "COMIDA" } });
        fireEvent.change(screen.getByLabelText("Precio (EUR)"), { target: { value: "1,25" } });

        const submit = screen.getByRole("button", { name: "Guardar producto" });
        fireEvent.click(submit);
        expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Guardando..." }));
        expect(mockCajaApi.createCajaProduct).toHaveBeenCalledTimes(1);

        resolveCreate({ ...product, id: "nuevo", name: "Nuevo", priceCents: 125 });
        expect(await screen.findByRole("status")).toHaveTextContent("Producto nuevo creado.");
    });

    it("requires a second confirmation before permanent deletion and cancels without a request", async () => {
        renderAdminPage();

        expect(await screen.findByRole("button", { name: "Desactivar" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Eliminar definitivamente" }))
            .not.toBeInTheDocument();
        expect(screen.queryByLabelText(/contraseña|credenciales/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Editar" }));
        fireEvent.click(screen.getByRole("button", { name: "Eliminar definitivamente" }));

        expect(screen.getByRole("heading", {
            name: "Eliminar definitivamente «Cerveza»",
        })).toBeInTheDocument();
        expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
        expect(mockCajaApi.deleteCajaProduct).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(mockCajaApi.deleteCajaProduct).not.toHaveBeenCalled();
        expect(screen.getByRole("heading", { name: "Editar Cerveza" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Eliminar definitivamente" })).toHaveFocus();
    });

    it("deletes only after final confirmation and removes the product with success feedback", async () => {
        mockCajaApi.deleteCajaProduct.mockResolvedValue(undefined);
        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
        fireEvent.click(screen.getByRole("button", { name: "Eliminar definitivamente" }));

        fireEvent.click(screen.getByRole("button", { name: "Eliminar definitivamente" }));

        expect(mockCajaApi.deleteCajaProduct).toHaveBeenCalledWith("rural-token", "cerveza");
        expect(await screen.findByRole("status"))
            .toHaveTextContent("Producto Cerveza eliminado definitivamente.");
        expect(screen.queryByRole("article")).not.toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("keeps the product visible and surfaces 404 when permanent deletion fails", async () => {
        mockCajaApi.deleteCajaProduct.mockRejectedValue(new Error("Producto de Caja no encontrado"));
        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
        fireEvent.click(screen.getByRole("button", { name: "Eliminar definitivamente" }));
        fireEvent.click(screen.getByRole("button", { name: "Eliminar definitivamente" }));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Producto de Caja no encontrado");
        expect(screen.getByRole("article")).toHaveTextContent("Cerveza");
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("keeps the form state and focus context when the delete action is cancelled", async () => {
        renderAdminPage();
        fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
        fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Cerveza editada" } });
        fireEvent.click(screen.getByRole("button", { name: "Eliminar definitivamente" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.getByLabelText("Nombre")).toHaveValue("Cerveza editada");
        expect(screen.getByRole("button", { name: "Eliminar definitivamente" })).toHaveFocus();
    });
});
