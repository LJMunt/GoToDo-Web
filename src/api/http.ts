import { runtimeConfig } from "../config";

const API_BASE = runtimeConfig.apiBase;

export function getToken(): string | null {
    return localStorage.getItem("token");
}

export function setToken(token: string | null) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
}

// Default timeout for API requests (ms)
const DEFAULT_TIMEOUT = 15000;

export async function apiFetch<T>(
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
                ...(init.headers ?? {}),
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!res.ok) {
        // Clear token on 401 to preserve expected auth flow without backend changes
        if (res.status === 401) setToken(null);

        let msg = `HTTP ${res.status}`;
        try {
            const data: unknown = await res.json();
            if (typeof data === "object" && data !== null && "error" in data) {
                const errVal = (data as { error?: unknown }).error;
                if (typeof errVal === "string") msg = errVal;
                else if (errVal != null) msg = String(errVal);
            }
        } catch {
            const text = await res.text().catch(() => "");
            if (text) msg = text;
        }
        throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
