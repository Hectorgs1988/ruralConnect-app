import {apiFetch, getErrorMessage } from "./client";

export type ApiUser = {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: "ADMIN" | "SOCIO";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export interface ListUsersParams {
    q?: string;
    role?: "ADMIN" | "SOCIO";
    active?: boolean;
    page?: number;
    size?: number;
}

export interface ListUsersResponse {
    items: ApiUser[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export async function listUsers(
    params: ListUsersParams = {},
    token: string
): Promise<ListUsersResponse> {
    const searchParams = new URLSearchParams();

    if (typeof params.active === "boolean") {
        searchParams.set("active", params.active ? "true" : "false");
    }
    if (params.q) searchParams.set("q", params.q);
    if (params.role) searchParams.set("role", params.role);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.size) searchParams.set("size", String(params.size));

    const query = searchParams.toString();
    const res = await apiFetch(`/api/users${query ? `?${query}` : ""}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al cargar los socios`));
    }

    return (await res.json()) as ListUsersResponse;
}

interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: "ADMIN" | "SOCIO";
}

export async function createUser(input: CreateUserInput, token: string): Promise<ApiUser> {
    const isAdmin = input.role === "ADMIN";
    const baseUrl = "/api/users";
    const url = isAdmin ? `${baseUrl}/admin` : baseUrl;

    const body = {
        email: input.email,
        password: input.password,
        name: input.name,
        phone: input.phone ?? null,
    };

    const res = await apiFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (res.status === 409) {
        throw new Error(await getErrorMessage(res, "Ya existe un usuario con ese email"));
    }

    if (!res.ok) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al crear el socio`));
    }

    return (await res.json()) as ApiUser;
}

interface UpdateUserInput {
    email: string;
    name: string;
    phone: string | null;
    role: "ADMIN" | "SOCIO";
}

export async function updateUser(
    id: string,
    input: UpdateUserInput,
    token: string
): Promise<ApiUser> {
    const res = await apiFetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (res.status === 409) {
        throw new Error(await getErrorMessage(res, "Ya existe un usuario con ese email"));
    }

    if (!res.ok) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al actualizar el socio`));
    }

    return (await res.json()) as ApiUser;
}

export async function deleteUser(id: string, token: string): Promise<void> {
    const res = await apiFetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok && res.status !== 204) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al eliminar el socio`));
    }
}

