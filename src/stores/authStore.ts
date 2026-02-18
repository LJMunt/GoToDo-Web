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

export const useAuthStore = create<AuthStore>((set) => ({
    state: { status: "loading" },
    refresh: async () => {
        const token = getToken();
        if (!token) {
            set({ state: { status: "anonymous" } });
            return;
        }

        set({ state: { status: "loading" } });
        try {
            const me = await getMe();
            set({
                state: {
                    status: "authenticated",
                    user: me as components["schemas"]["UserMe"],
                },
            });
        } catch {
            // token invalid/expired/etc
            setToken(null);
            set({ state: { status: "anonymous" } });
        }
    },
    logout: () => {
        setToken(null);
        set({ state: { status: "anonymous" } });
    },
}));
