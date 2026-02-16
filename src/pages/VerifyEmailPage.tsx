import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../api/auth";
import { useAuth } from "../features/auth/AuthContext";
import { useConfig } from "../features/config/ConfigContext";

type LocationState = { email?: string } | null;

export default function VerifyEmailPage() {
    const { config } = useConfig();
    const { refresh } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const initialEmail = (location.state as LocationState)?.email ?? "";
    const [email, setEmail] = useState(initialEmail);
    const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const [resent, setResent] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const tokenFromQuery = useMemo(() => searchParams.get("token"), [searchParams]);

    useEffect(() => {
        if (tokenFromQuery) {
            void handleVerify(tokenFromQuery, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally run once per token change
    }, [tokenFromQuery]);

    async function handleVerify(token: string, fromQuery = false) {
        if (!token) return;
        setStatus("verifying");
        setError(null);
        try {
            await verifyEmail(token);
            await refresh();
            setStatus("success");
            nav("/", { replace: true });
        } catch (err: unknown) {
            setStatus("error");
            const msg = err instanceof Error ? err.message : "Verification failed";
            setError(msg === "invalid or expired token" ? "The verification link is invalid or expired. Tap \"Send again\" for a fresh link." : msg);
        }
    }

    async function handleResend() {
        setIsResending(true);
        setError(null);
        setResent(false);
        try {
            await resendVerificationEmail(email);
            setResent(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to resend email");
        } finally {
            setIsResending(false);
        }
    }

    return (
        <div className="min-h-screen bg-bg-base text-text-base flex items-center justify-center px-6">
            <div className="w-full max-w-105 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-on-brand shadow-brand-500/40 shadow-lg mb-6">
                        <span className="text-2xl font-black italic">{config.branding.appLogoInitial}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-linear-to-br from-text-base to-text-muted bg-clip-text text-transparent">
                        Verify your email
                    </h1>
                    <p className="mt-3 text-text-muted font-medium max-w-xl">
                        We sent a verification link to your inbox. Open it to activate your account and continue.
                    </p>
                </div>

                <div className="rounded-4xl border border-surface-8 bg-surface-3 p-8 shadow-2xl shadow-black ring-1 ring-surface-10 backdrop-blur-sm space-y-6">
                    {status === "verifying" && (
                        <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-400 font-bold flex items-center gap-2 animate-pulse">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Verifying your email...
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    {!tokenFromQuery && (
                        <div className="rounded-2xl border border-surface-8 bg-surface-2 px-4 py-3 text-sm text-text-muted font-medium">
                            Open the verification link we emailed you on this device. We’ll log you in automatically.
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Didn&apos;t get it? Resend</label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                className="flex-1 rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 placeholder:text-text-muted/40 font-medium"
                                type="email"
                                autoComplete="email"
                                placeholder={config.auth.emailPlaceholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button
                                type="button"
                                className="w-full sm:w-auto rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-sm font-black uppercase tracking-widest text-text-base shadow-lg transition-all hover:border-brand-500/40 hover:text-brand-400 active:scale-[0.98] disabled:opacity-60"
                                onClick={() => void handleResend()}
                                disabled={!email || isResending}
                            >
                                {isResending ? "Sending..." : "Send again"}
                            </button>
                        </div>
                        {resent && (
                            <p className="text-xs font-bold text-emerald-400 ml-1">If that email is registered, a new link is on the way.</p>
                        )}
                    </div>

                    <div className="text-center text-sm text-text-muted">
                        Already verified? <Link className="text-brand-500 hover:text-brand-400 font-bold transition-colors" to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
