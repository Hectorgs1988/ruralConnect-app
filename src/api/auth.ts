import { apiFetch } from "./client";
const BASE = "/api/auth";

export async function login(email: string, password: string) {
    const r = await apiFetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw new Error((await r.json()).error || "Login fallido");
    return r.json();
}

export async function logout() {
    await apiFetch(`${BASE}/logout`, { method: "POST", credentials: "include" });
}

export async function me() {
    const r = await apiFetch(`${BASE}/me`, { credentials: "include" });
    if (!r.ok) return null;
    return r.json();
}


export async function forgotPassword(email: string) {
    const r = await apiFetch(`${BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!r.ok) {
        let msg = "Error al solicitar recuperación de contraseña";
        try {
            const body = await r.json();
            if (body && body.error) msg = body.error;
        } catch {
            // ignorar error al parsear JSON
        }
        throw new Error(msg);
    }

    return r.json();
}

export async function resetPassword(token: string, password: string) {
    const r = await apiFetch(`${BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
    });

    if (!r.ok) {
        let msg = "Error al restablecer la contraseña";
        try {
            const body = await r.json();
            if (body && body.error) msg = body.error;
        } catch {
        }
        throw new Error(msg);
    }

    return r.json();
}
