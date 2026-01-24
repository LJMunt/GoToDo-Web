import { runtimeConfig } from "../config.ts";

const API_BASE = runtimeConfig.apiBase;

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            ...(init.headers ?? {}),
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
