import {type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";
import { useAuth } from "../features/auth/AuthContext";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nav = useNavigate();
    const { refresh } = useAuth();

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await signup({ email, password });
            await refresh();
            nav("/", { replace: true });
        } catch (err: any) {
            setError(err?.message ?? "Signup failed");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow">
                <h1 className="text-2xl font-semibold">Create account</h1>
                <p className="mt-1 text-sm text-slate-400">Self-hosted tasks await.</p>

                {error && (
                    <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300">Email</label>
                        <input
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-300">Password</label>
                        <input
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500">Min 8 characters.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:opacity-60"
                    >
                        {isSubmitting ? "Creating…" : "Create account"}
                    </button>
                </form>

                <p className="mt-4 text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link className="text-slate-200 hover:underline" to="/login">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
