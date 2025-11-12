// src/components/guards/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

/** Protege rutas si NO hay usuario */
export function PrivateRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <>{children}</> : <Navigate to="/" replace />;
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
