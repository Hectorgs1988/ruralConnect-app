import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/api/client';

type User = { id: string; name: string; email: string; role: 'ADMIN' | 'SOCIO' };
type AuthState = { user: User | null; token: string | null; loading: boolean };
type AuthCtx = AuthState & {
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

    useEffect(() => {
        const raw = localStorage.getItem('auth');
        if (raw) setState({ ...JSON.parse(raw), loading: false });
        else setState(s => ({ ...s, loading: false }));
    }, []);

    async function login(email: string, password: string): Promise<User> {
        const r = await apiFetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!r.ok) throw new Error((await r.json()).error ?? 'Login failed');
        const data = await r.json(); // { token, user }
        setState({ user: data.user, token: data.token, loading: false });
        localStorage.setItem('auth', JSON.stringify({ user: data.user, token: data.token }));
        return data.user;
    }

    function logout() {
        localStorage.removeItem('auth');
        setState({ user: null, token: null, loading: false });
    }

    return (
        <Ctx.Provider value={{ ...state, login, logout }}>
            {children}
        </Ctx.Provider>
    );
}

export function useAuth() {
    const v = useContext(Ctx);
    if (!v) throw new Error('useAuth must be used within AuthProvider');
    return v;
}
