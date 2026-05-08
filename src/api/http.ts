import { runtimeConfig } from "../config";
import { useAuthStore } from "../stores/authStore";

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

export interface ApiOptions extends RequestInit {
    skipWorkspace?: boolean;
}

export async function apiFetch<T>(
    path: string,
    init: ApiOptions = {}
): Promise<T> {
    const { skipWorkspace, ...fetchInit } = init;
    const token = getToken();
    const authState = useAuthStore.getState().state;
    let workspaceId = (authState.status === "authenticated" && !skipWorkspace) ? authState.workspaceId : null;
    if (workspaceId === "null" || workspaceId === "undefined") workspaceId = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...fetchInit,
            signal: controller.signal,
            headers: {
                ...(fetchInit.headers ?? {}),
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(workspaceId ? { "X-Workspace-ID": workspaceId } : {}),
            },
        });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!res.ok) {
        // Clear token on 401 to preserve expected auth flow without backend changes
        if (res.status === 401) setToken(null);

        let msg = `HTTP ${res.status}`;
        const text = await res.text().catch(() => "");
        try {
            const data: unknown = JSON.parse(text);
            if (typeof data === "object" && data !== null) {
                const d = data as Record<string, unknown>;
                const errVal = d.error || d.message;
                if (typeof errVal === "string") msg = errVal;
                else if (errVal != null) msg = String(errVal);
            }
        } catch {
            if (text) msg = text;
        }

        // Reset workspace on "not found" to recover from invalid active workspace state
        // Only reset if the message is specifically about the workspace itself being not found
        // and we were actually sending a workspace header.
        const lowerMsg = msg.toLowerCase().trim();
        if (res.status === 404 && lowerMsg.includes("workspace") && lowerMsg.includes("not found") && workspaceId) {
            const currentStore = useAuthStore.getState();
            const currentWorkspaceId = currentStore.state.status === "authenticated" ? currentStore.state.workspaceId : null;
            
            // Only reset if we actually have an active organization workspace set
            if (currentStore.state.status === "authenticated" && currentWorkspaceId !== null) {
                console.warn(`Workspace not found: sending "${workspaceId}", current state is "${currentWorkspaceId}". Resetting to personal workspace.`);
                currentStore.setWorkspaceId(null);
            }
        }

        throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
