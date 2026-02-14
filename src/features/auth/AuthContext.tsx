import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { getToken, setToken } from "../../api/http";
import { getMe } from "../../api/users";
import type { components } from "../../api/schema";

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
    const [state, setState] = useState<AuthState>({ status: "loading" });

    const refresh = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setState({ status: "anonymous" });
            return;
        }

        setState({ status: "loading" });
        try {
            const me = await getMe();
            setState({
                status: "authenticated",
                user: me as components["schemas"]["UserMe"],
            });
        } catch {
            // token invalid/expired/etc
            setToken(null);
            setState({ status: "anonymous" });
        }
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setState({ status: "anonymous" });
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial auth hydration requires a state update after verifying the token.
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
