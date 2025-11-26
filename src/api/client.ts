const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}${path}`;
    const res = await fetch(url, {
        ...options,
    });
    return res;
}

export async function getErrorMessage(res: Response, fallback?: string): Promise<string> {
    try {
        const data = await res.json();
        if (data && typeof data === "object") {
            const anyData = data as any;
            if (typeof anyData.error === "string") return anyData.error;
            if (typeof anyData.message === "string") return anyData.message;
        }
    } catch {
    }

    return fallback ?? `Error ${res.status}`;
}
