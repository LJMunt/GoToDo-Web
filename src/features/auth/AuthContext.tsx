import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { components } from "../../api/schema";
import { useAuthStore } from "../../stores/authStore";

type AuthState =
    | { status: "loading" }
    | { status: "anonymous" }
    | { status: "authenticated"; user: components["schemas"]["UserMe"] };

type AuthContextValue = {
    state: AuthState;
    refresh: () => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { state, refresh, logout } = useAuthStore();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const value = useMemo(() => ({ state, refresh, logout }), [logout, refresh, state]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- exporting hook from the context module is intentional.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
