import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useAuthStore, type AuthState } from "../../stores/authStore";

type AuthContextValue = {
    state: AuthState;
    refresh: () => Promise<void>;
    logout: () => void;
    setWorkspaceId: (workspaceId: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { state, refresh, logout, setWorkspaceId } = useAuthStore();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const value = useMemo(() => ({ state, refresh, logout, setWorkspaceId }), [logout, refresh, state, setWorkspaceId]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- exporting hook from the context module is intentional.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
