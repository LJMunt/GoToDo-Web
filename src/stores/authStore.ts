import { create } from "zustand";
import { getToken, setToken } from "../api/http";
import { getMe } from "../api/users";
import { logout as apiLogout } from "../api/auth";
import type { components } from "../api/schema";

export type AuthState =
    | { status: "loading" }
    | { status: "anonymous" }
    | { status: "authenticated"; user: components["schemas"]["UserMe"]; workspaceId: string | null };

export interface AuthStore {
    state: AuthState;
    refresh: () => Promise<void>;
    logout: () => void;
    setWorkspaceId: (workspaceId: string | null) => void;
}

const WORKSPACE_ID_KEY = "activeWorkspaceId";

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
            const savedWorkspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
            const personalWorkspace = me.workspaces.find((w) => w.type === "user") || me.workspaces[0];
            if (!personalWorkspace) {
                throw new Error("No workspace found for user");
            }

            let workspaceId: string | null = null;
            if (savedWorkspaceId && savedWorkspaceId !== "null" && savedWorkspaceId !== "undefined" && savedWorkspaceId !== personalWorkspace.public_id) {
                // Workspace IDs are 26-char strings (public_id). If it looks like a numeric ID, it's invalid.
                const isNumeric = /^\d+$/.test(savedWorkspaceId);
                if (!isNumeric) {
                    workspaceId = savedWorkspaceId;
                } else {
                    localStorage.removeItem(WORKSPACE_ID_KEY);
                }
            } else if (savedWorkspaceId === "null" || savedWorkspaceId === "undefined") {
                localStorage.removeItem(WORKSPACE_ID_KEY);
            }

            set({
                state: {
                    status: "authenticated",
                    user: me as components["schemas"]["UserMe"],
                    workspaceId: workspaceId,
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
    logout: () => {
        // Fire-and-forget server-side logout; clear local state immediately
        void apiLogout().catch(() => {
            // ignore errors
        });
        setToken(null);
        localStorage.removeItem(WORKSPACE_ID_KEY);
        set({ state: { status: "anonymous" } });
    },
    setWorkspaceId: (workspaceId: string | null) => {
        set((s) => {
            const state = s.state;
            if (state.status !== "authenticated") return s;

            const personal = state.user.workspaces.find(w => w.type === "user") || state.user.workspaces[0];
            
            let finalWorkspaceId = workspaceId;
            if (finalWorkspaceId === personal?.public_id || !finalWorkspaceId || finalWorkspaceId === "null" || finalWorkspaceId === "undefined") {
                finalWorkspaceId = null;
            }

            // Prevent setting numeric IDs as workspace IDs
            if (finalWorkspaceId && /^\d+$/.test(finalWorkspaceId)) {
                console.warn(`Attempted to set numeric workspace ID: ${finalWorkspaceId}. Ignoring.`);
                finalWorkspaceId = null;
            }

            if (finalWorkspaceId && typeof finalWorkspaceId === "string") {
                localStorage.setItem(WORKSPACE_ID_KEY, finalWorkspaceId);
            } else {
                localStorage.removeItem(WORKSPACE_ID_KEY);
            }

            return {
                state: {
                    ...state,
                    workspaceId: finalWorkspaceId,
                },
            };
        });
    },
}));
