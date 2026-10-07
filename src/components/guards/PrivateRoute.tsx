// src/components/guards/PrivateRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

/** Protege rutas si NO hay usuario */
export function PrivateRoute({
    children,
    redirectToLogin = false,
}: {
    children: ReactNode;
    redirectToLogin?: boolean;
}) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return null;
    if (user) return <>{children}</>;
    if (!redirectToLogin) return <Navigate to="/" replace />;

    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
}

/** Protege rutas por rol (ADMIN | SOCIO) */
export function RoleGuard({
    role,
    children,
}: {
    role: "ADMIN" | "SOCIO";
    children: ReactNode;
}) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== role) return <Navigate to="/" replace />;
    return <>{children}</>;
}

export default PrivateRoute;
