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

