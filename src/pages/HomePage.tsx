import { useAuth } from "../features/auth/AuthContext";

export default function HomePage() {
    const { state } = useAuth();

    if (state.status !== "authenticated") return null;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">You’re in ✅</h1>
            <p className="mt-2 text-slate-300">
                Logged in as: <span className="font-medium">{state.user.email}</span>
            </p>
            <pre className="mt-4 rounded-lg bg-slate-900 p-4 text-sm text-slate-200 border border-slate-800 overflow-auto">
        {JSON.stringify(state.user, null, 2)}
      </pre>
        </div>
    );
}
