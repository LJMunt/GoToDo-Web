import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { state } = useAuth();
    const location = useLocation();

    if (state.status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-slate-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-500" />
                    <div className="text-sm font-medium tracking-wide">
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
