import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyMfaTotp } from "../api/auth";
import { useAuth } from "../features/auth/AuthContext";
import { useConfig } from "../features/config/ConfigContext";

export default function MFAPage() {
    const { config } = useConfig();
    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nav = useNavigate();
    const location = useLocation();
    const state = location.state as { mfa_token?: string; from?: string } | null;
    const mfaToken = state?.mfa_token;
    const from = state?.from ?? "/";
    const { refresh } = useAuth();

    if (!mfaToken) {
        nav("/login", { replace: true });
        return null;
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await verifyMfaTotp({ mfa_token: mfaToken!, code });
            await refresh();
            nav(from, { replace: true });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : config.auth.invalidMfaCode || "Invalid MFA code";
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-bg-base text-text-base flex items-center justify-center px-6 selection:bg-brand-500/30">
            <div className="w-full max-w-105 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-on-brand shadow-brand-500/40 shadow-lg mb-6">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-linear-to-br from-text-base to-text-muted bg-clip-text text-transparent">
                        {config.auth.mfaTitle}
                    </h1>
                    <p className="mt-3 text-text-muted font-medium">
                        {config.auth.mfaSubtitle}
                    </p>
                </div>

                <div className="rounded-4xl border border-surface-8 bg-surface-3 p-8 shadow-2xl shadow-black ring-1 ring-surface-10 backdrop-blur-sm">
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.auth.mfaCodeLabel}</label>
                            <input
                                className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 placeholder:text-text-muted/40 font-medium text-center text-2xl tracking-[0.5em]"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder={config.auth.mfaCodePlaceholder}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || code.length !== 6}
                            className="group relative w-full overflow-hidden rounded-2xl bg-brand-500 px-4 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {config.auth.verifyingMfa}
                                    </>
                                ) : (
                                    config.auth.verifyMfaButton
                                )}
                            </div>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => nav("/login")}
                            className="w-full text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-base transition-colors"
                        >
                            {config.auth.backToLogin}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
