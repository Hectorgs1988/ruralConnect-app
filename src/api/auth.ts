const BASE = "/api/auth";

export async function login(email: string, password: string) {
    const r = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 cookies
        body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw new Error((await r.json()).error || "Login fallido");
    return r.json();
}

export async function logout() {
    await fetch(`${BASE}/logout`, { method: "POST", credentials: "include" });
}

export async function me() {
    const r = await fetch(`${BASE}/me`, { credentials: "include" });
    if (!r.ok) return null;
    return r.json();
}
