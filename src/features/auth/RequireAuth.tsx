import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { state } = useAuth();
    const location = useLocation();

    if (state.status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-orange-100">
                <div className="rounded-full border border-orange-500/30 px-4 py-2 text-sm text-orange-200">
                    Loading your workspace…
                </div>
            </div>
        );
    }

    if (state.status !== "authenticated") {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}
