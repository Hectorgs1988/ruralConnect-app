import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import appRouter from "@/routes";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import { validateCajaProductForm } from "../productForm";

const mockListCajaProducts = vi.hoisted(() => vi.fn());
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
    listCajaProducts: mockListCajaProducts,
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
        mockListCajaProducts.mockReset().mockResolvedValue([product]);
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
        expect(screen.getByText(/solo devuelve productos activos/i)).toBeInTheDocument();
        expect(mockListCajaProducts).toHaveBeenCalledWith("rural-token");
    });

    it("denies non-admin users using the existing role guard", () => {
        mockAuth.state.user.role = "SOCIO";
        renderAdminPage();

        expect(screen.queryByRole("heading", { name: "Gestión de productos de Caja" }))
            .not.toBeInTheDocument();
        expect(mockListCajaProducts).not.toHaveBeenCalled();
    });

    it("opens a creation form and validates required fields", async () => {
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Crear producto" }));
        expect(screen.getByRole("heading", { name: "Crear producto" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Validar borrador" }));

        expect(screen.getByText("El ID es obligatorio.")).toBeInTheDocument();
        expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
        expect(screen.getByText("Selecciona Bebida o Comida.")).toBeInTheDocument();
        expect(screen.getByText(/precio no negativo/i)).toBeInTheDocument();
    });

    it("opens the edit form with existing values and keeps the product ID read-only", async () => {
        renderAdminPage();

        fireEvent.click(await screen.findByRole("button", { name: "Editar" }));

        expect(screen.getByRole("heading", { name: "Editar Cerveza" })).toBeInTheDocument();
        expect(screen.getByLabelText("ID")).toHaveValue("cerveza");
        expect(screen.getByLabelText("ID")).toHaveAttribute("readonly");
        expect(screen.getByLabelText("Nombre")).toHaveValue("Cerveza");
        expect(screen.getByLabelText("Categoría")).toHaveValue("BEBIDA");
        expect(screen.getByLabelText("Precio (EUR)")).toHaveValue("1.50");
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

    it("converts a valid EUR price to integer cents and keeps the form UI-only", async () => {
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
        fireEvent.click(screen.getByRole("button", { name: "Validar borrador" }));

        expect(await screen.findByRole("status"))
            .toHaveTextContent("Borrador validado (nuevo: 125 céntimos). No se ha guardado");
        expect(screen.queryByText("Nuevo")).not.toBeInTheDocument();
        expect(mockListCajaProducts).toHaveBeenCalledTimes(1);
    });

    it("offers deactivation intent but no hard-delete or independent admin credentials", async () => {
        renderAdminPage();

        expect(await screen.findByRole("button", { name: "Desactivar" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /eliminar|borrar/i })).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/contraseña|credenciales/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
        expect(await screen.findByText(/no se ha ejecutado.*S2-05/i)).toBeInTheDocument();
        expect(screen.getByText("Activo")).toBeInTheDocument();
    });
});
