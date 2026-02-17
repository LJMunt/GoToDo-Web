import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../features/auth/AuthContext";
import { useConfig } from "../features/config/ConfigContext";


export default function LoginPage() {
    const { config, status, language, setLanguage, availableLanguages } = useConfig();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nav = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from ?? "/";
    const { refresh } = useAuth();


    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const res = await login({ email, password });
            if (res.token) {
                await refresh();
                nav(from, { replace: true });
            } else {
                nav("/verify-email", { state: { email } });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Login failed";
            setError(msg);
            if (msg.toLowerCase().includes("email_not_verified") || msg.toLowerCase().includes("verify your email")) {
                nav("/verify-email", { state: { email } });
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-bg-base text-text-base flex items-center justify-center px-6 selection:bg-brand-500/30">
            <div className="w-full max-w-105 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-on-brand shadow-brand-500/40 shadow-lg mb-6">
                        <span className="text-2xl font-black italic">{config.branding.appLogoInitial}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-linear-to-br from-text-base to-text-muted bg-clip-text text-transparent">
                        {config.auth.loginTitle}
                    </h1>
                    <p className="mt-3 text-text-muted font-medium">
                        {config.auth.loginSubtitle}
                    </p>
                </div>

                <div className="rounded-4xl border border-surface-8 bg-surface-3 p-8 shadow-2xl shadow-black ring-1 ring-surface-10 backdrop-blur-sm">
                    {status?.instance.readOnly && (
                        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-500 font-black uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            ReadOnly Mode
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.auth.emailLabel}</label>
                            <input
                                className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 placeholder:text-text-muted/40 font-medium"
                                type="email"
                                autoComplete="email"
                                placeholder={config.auth.emailPlaceholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">{config.auth.passwordLabel}</label>
                            </div>
                            <input
                                className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 placeholder:text-text-muted/40 font-medium"
                                type="password"
                                autoComplete="current-password"
                                placeholder={config.auth.passwordPlaceholder}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full overflow-hidden rounded-2xl bg-brand-500 px-4 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {config.auth.signingIn}
                                    </>
                                ) : (
                                    config.auth.signInButton
                                )}
                            </div>
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-surface-5 text-center">
                        {status?.auth.allowSignup !== false && (
                            <p className="text-sm text-text-muted font-medium mb-6">
                                {config.auth.noAccountPrompt}{" "}
                                <Link className="text-brand-500 hover:text-brand-400 font-bold transition-colors" to="/signup">
                                    {config.auth.createOneLink}
                                </Link>
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {availableLanguages.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => setLanguage(l.code)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                        language === l.code
                                            ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                                            : "text-text-muted hover:text-text-base border border-transparent"
                                    }`}
                                >
                                    {l.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
