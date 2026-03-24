import { create } from "zustand";
import { getToken, setToken } from "../api/http";
import { getMe } from "../api/users";
import { logout as apiLogout } from "../api/auth";
import type { components } from "../api/schema";

type AuthState =
    | { status: "loading" }
    | { status: "anonymous" }
    | { status: "authenticated"; user: components["schemas"]["UserMe"]; workspaceId: string };

interface AuthStore {
    state: AuthState;
    refresh: () => Promise<void>;
    setWorkspace: (workspaceId: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    state: { status: "loading" },
    refresh: async () => {
        const token = getToken();
        if (!token) {
            set({ state: { status: "anonymous" } });
            return;
        }

        const isCurrentlyAuthenticated = get().state.status === "authenticated";
        if (!isCurrentlyAuthenticated) {
            set({ state: { status: "loading" } });
        }

        try {
            const me = await getMe();
            const currentWorkspaceId = get().state.status === "authenticated" ? get().state.workspaceId : null;
            
            const workspaces = me.workspaces ?? [];
            
            // Validate if current workspace still exists in the list
            const hasCurrentWorkspace = currentWorkspaceId && workspaces.some(w => w.public_id === currentWorkspaceId);
            
            const workspace = hasCurrentWorkspace 
                ? workspaces.find(w => w.public_id === currentWorkspaceId)!
                : (workspaces.find((w) => w.type === "user") || workspaces[0]);

            if (!workspace) {
                throw new Error("No workspace found for user");
            }

            set({
                state: {
                    status: "authenticated",
                    user: { ...me, workspaces } as components["schemas"]["UserMe"],
                    workspaceId: workspace.public_id,
                },
            });
        } catch (err) {
            // Check if it's actually an auth error.
            // apiFetch() clears the token on 401.
            const currentToken = getToken();
            if (!currentToken) {
                set({ state: { status: "anonymous" } });
            } else if (!isCurrentlyAuthenticated) {
                // If it failed and we weren't logged in yet, we can't really proceed.
                set({ state: { status: "anonymous" } });
            } else {
                // It was likely a network error or 500.
                // Keep the current state if we were already authenticated.
                console.warn("Auth refresh failed, but token still exists. Keeping current state.", err);
            }
        }
    },
    setWorkspace: (workspaceId: string) => {
        const currentState = get().state;
        if (currentState.status === "authenticated" && currentState.workspaceId !== workspaceId) {
            set({
                state: {
                    ...currentState,
                    workspaceId,
                },
            });
        }
    },
    logout: () => {
        // Fire-and-forget server-side logout; clear local state immediately
        void apiLogout().catch(() => {
            // ignore errors
        });
        setToken(null);
        set({ state: { status: "anonymous" } });
    },
}));
