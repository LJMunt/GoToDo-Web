import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { state } = useAuth();
    const location = useLocation();

    if (state.status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-slate-400">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-[0_0_25px_rgba(249,115,22,0.4)] animate-wiggle">
                        <span className="text-2xl font-black italic">G</span>
                    </div>
                    <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 animate-pulse">
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
