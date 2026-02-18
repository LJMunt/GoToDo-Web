import { create } from "zustand";
import { getToken, setToken } from "../api/http";
import { getMe } from "../api/users";
import type { components } from "../api/schema";

type AuthState =
    | { status: "loading" }
    | { status: "anonymous" }
    | { status: "authenticated"; user: components["schemas"]["UserMe"] };

interface AuthStore {
    state: AuthState;
    refresh: () => Promise<void>;
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
            set({
                state: {
                    status: "authenticated",
                    user: me as components["schemas"]["UserMe"],
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
        setToken(null);
        set({ state: { status: "anonymous" } });
    },
}));
