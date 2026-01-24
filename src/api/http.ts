import { runtimeConfig } from "../config";

const API_BASE = runtimeConfig.apiBase;

export function getToken(): string | null {
    return localStorage.getItem("token");
}

export function setToken(token: string | null) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
}

export async function apiFetch<T>(
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            ...(init.headers ?? {}),
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            if (data?.error) msg = String(data.error);
        } catch {
            const text = await res.text().catch(() => "");
            if (text) msg = text;
        }
        throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
