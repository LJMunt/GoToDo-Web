import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getToken, setToken } from "../../api/http";
import { getMe } from "../../api/users";

type AuthState =
    | { status: "loading" }
    | { status: "anonymous" }
    | { status: "authenticated"; user: any };

type AuthContextValue = {
    state: AuthState;
    refresh: () => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({ status: "loading" });

    async function refresh() {
        const token = getToken();
        if (!token) {
            setState({ status: "anonymous" });
            return;
        }

        setState({ status: "loading" });
        try {
            const me = await getMe();
            setState({ status: "authenticated", user: me });
        } catch (err) {
            // token invalid/expired/etc
            setToken(null);
            setState({ status: "anonymous" });
        }
    }

    function logout() {
        setToken(null);
        setState({ status: "anonymous" });
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo(() => ({ state, refresh, logout }), [state]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
