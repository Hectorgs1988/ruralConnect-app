import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import appRouter from "@/routes";

const mockAuth = vi.hoisted(() => ({
    state: {
        user: null as {
            id: string;
            name: string;
            email: string;
            role: "ADMIN" | "SOCIO";
        } | null,
        token: null as string | null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
    },
}));

vi.mock("@/context/AuthContext", () => ({
    useAuth: () => mockAuth.state,
}));

describe("Caja direct route authentication", () => {
    beforeEach(() => {
        mockAuth.state.user = null;
        mockAuth.state.loading = false;
        mockAuth.state.login.mockReset();
    });

    it("sends an unauthenticated direct visitor through login and back to Caja", async () => {
        const user = {
            id: "user-1",
            name: "Rural User",
            email: "user@example.com",
            role: "SOCIO" as const,
        };
        mockAuth.state.login.mockImplementation(async () => {
            mockAuth.state.user = user;
            return user;
        });
        const router = createMemoryRouter(appRouter.routes, {
            initialEntries: ["/caja?turno=1#ticket"],
        });

        render(
            <RouterProvider router={router} />,
        );

        expect(await screen.findByRole("heading", { name: "Bienvenido/a a Rural Connect" })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Usuario"), {
            target: { value: "user" },
        });
        fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
            target: { value: "password" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

        expect(await screen.findByRole("heading", { name: "Caja Susinos" })).toBeInTheDocument();
        expect(screen.getByText("Sesión iniciada como Rural User")).toBeInTheDocument();
        expect(mockAuth.state.login).toHaveBeenCalledWith("user", "password");
    });

    it("renders Caja with the existing Rural Connect user when authenticated", () => {
        mockAuth.state.user = {
            id: "user-1",
            name: "Rural User",
            email: "user@example.com",
            role: "SOCIO",
        };
        const router = createMemoryRouter(appRouter.routes, {
            initialEntries: ["/caja"],
        });

        render(
            <RouterProvider router={router} />,
        );

        expect(screen.getByRole("heading", { name: "Caja Susinos" })).toBeInTheDocument();
        expect(screen.getByText("Sesión iniciada como Rural User")).toBeInTheDocument();
    });
});
