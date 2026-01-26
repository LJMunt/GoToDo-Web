import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { state } = useAuth();
    const location = useLocation();

    if (state.status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg-base text-text-muted">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-on-brand shadow-brand-500/40 shadow-lg animate-wiggle">
                        <span className="text-2xl font-black italic">G</span>
                    </div>
                    <div className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted animate-pulse">
                        Preparing your workspace…
                    </div>
                </div>
            </div>
        );
    }

    if (state.status !== "authenticated") {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}
