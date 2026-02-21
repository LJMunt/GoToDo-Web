import { type FormEvent, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, validatePasswordResetToken } from "../api/auth";
import { useConfig } from "../features/config/ConfigContext";
import { PasswordRequirements } from "../components/PasswordRequirements";

export default function ResetPasswordPage() {
    const { config, status } = useConfig();
    const [searchParams] = useSearchParams();
    const nav = useNavigate();

    const selector = searchParams.get("selector") || "";
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (status && !status.auth.allowReset) {
            nav("/login", { replace: true });
        }
    }, [status, nav]);

    useEffect(() => {
        async function validate() {
            if (!selector || !token) {
                setIsTokenValid(false);
                setIsValidating(false);
                return;
            }

            try {
                const res = await validatePasswordResetToken({ selector, token });
                setIsTokenValid(res.valid);
            } catch (err) {
                console.error("Token validation failed", err);
                setIsTokenValid(false);
            } finally {
                setIsValidating(false);
            }
        }
        void validate();
    }, [selector, token]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await confirmPasswordReset({
                selector,
                token,
                newPassword: password,
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                setError("Failed to reset password");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to reset password");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isValidating) {
        return (
            <div className="min-h-screen bg-bg-base text-text-base flex items-center justify-center px-6">
                 <div className="flex flex-col items-center gap-4">
                    <svg className="h-10 w-10 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-text-muted font-medium animate-pulse">{config.ui.loading}</p>
                </div>
            </div>
        );
    }

    if (!isTokenValid && !success) {
        return (
            <div className="min-h-screen bg-bg-base text-text-base flex items-center justify-center px-6 selection:bg-brand-500/30">
                <div className="w-full max-w-105 animate-in fade-in zoom-in duration-700">
                    <div className="flex flex-col items-center text-center mb-10">
                         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-6">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-base">
                            Invalid Reset Link
                        </h1>
                        <p className="mt-3 text-text-muted font-medium">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                    </div>

                    <div className="rounded-4xl border border-surface-8 bg-surface-3 p-8 shadow-2xl shadow-black ring-1 ring-surface-10 backdrop-blur-sm text-center">
                        <Link className="text-brand-500 hover:text-brand-400 font-bold transition-colors" to="/request-password-reset">
                            {config.auth.requestResetTitle}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-bg-base text-text-base flex items-center justify-center px-6 selection:bg-brand-500/30">
                <div className="w-full max-w-105 animate-in fade-in zoom-in duration-700">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-emerald-500/40 shadow-lg mb-6">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-br from-text-base to-text-muted bg-clip-text text-transparent">
                            Password Reset
                        </h1>
                        <p className="mt-3 text-text-muted font-medium">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>
                    </div>

                    <div className="rounded-4xl border border-surface-8 bg-surface-3 p-8 shadow-2xl shadow-black ring-1 ring-surface-10 backdrop-blur-sm text-center">
                        <Link className="text-brand-500 hover:text-brand-400 font-bold transition-colors" to="/login">
                            {config.auth.backToLogin}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-base text-text-base flex items-center justify-center px-6 selection:bg-brand-500/30">
            <div className="w-full max-w-105 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-on-brand shadow-brand-500/40 shadow-lg mb-6">
                        <span className="text-2xl font-black italic">{config.branding.appLogoInitial}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-linear-to-br from-text-base to-text-muted bg-clip-text text-transparent">
                        {config.auth.resetPasswordTitle}
                    </h1>
                    <p className="mt-3 text-text-muted font-medium">
                        {config.auth.resetPasswordSubtitle}
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
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.auth.newPasswordLabel}</label>
                            <input
                                className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 placeholder:text-text-muted/40 font-medium"
                                type="password"
                                autoComplete="new-password"
                                placeholder={config.auth.passwordPlaceholder}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.ui.confirmPasswordLabel}</label>
                            <input
                                className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 placeholder:text-text-muted/40 font-medium"
                                type="password"
                                autoComplete="new-password"
                                placeholder={config.auth.passwordPlaceholder}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <PasswordRequirements password={password} />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full overflow-hidden rounded-2xl bg-brand-500 px-4 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {config.ui.loading}
                                    </>
                                ) : (
                                    config.auth.resetPasswordButton
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
