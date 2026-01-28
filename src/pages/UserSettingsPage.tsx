import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme, type Theme } from "../features/theme/ThemeContext";
import { changePassword } from "../api/auth";
import { updateMe } from "../api/users";
import type { components } from "../api/schema";

type UserSettings = NonNullable<components["schemas"]["UserMe"]["settings"]>;

export default function UserSettingsPage() {
    const { state, refresh } = useAuth();
    const { setTheme } = useTheme();
    const user = state.status === "authenticated" ? state.user : null;

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const [updatingSettings, setUpdatingSettings] = useState(false);
    const [settingsError, setSettingsError] = useState("");

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    if (!user) return null;

    const settings = user.settings || { theme: "system", showCompletedDefault: false };

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess(false);
        try {
            await changePassword({ currentPassword, newPassword });
            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
        } catch (err: unknown) {
            setPasswordError(err instanceof Error ? err.message : "Failed to change password");
        }
    }

    async function updateSetting(key: string, value: string | boolean) {
        setSettingsError("");
        setUpdatingSettings(true);
        if (key === "theme") {
            setTheme(value as Theme);
        }
        try {
            await updateMe({
                settings: {
                    ...settings,
                    [key]: value,
                } as UserSettings,
            });
            await refresh();
        } catch (err: unknown) {
            setSettingsError(err instanceof Error ? err.message : "Failed to update settings");
        } finally {
            setUpdatingSettings(false);
        }
    }

    async function handleEmailUpdate() {
        if (!isEditingEmail) {
            setNewEmail(user?.email || "");
            setIsEditingEmail(true);
            setEmailError("");
            return;
        }

        if (newEmail === user?.email) {
            setIsEditingEmail(false);
            return;
        }

        setUpdatingSettings(true);
        setEmailError("");
        try {
            await updateMe({ email: newEmail });
            await refresh();
            setIsEditingEmail(false);
        } catch (err: unknown) {
            setEmailError(err instanceof Error ? err.message : "Failed to update email");
        } finally {
            setUpdatingSettings(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-4">
            <div>
                <h1 className="text-3xl font-extrabold text-text-base tracking-tight">Settings</h1>
                <p className="text-text-muted mt-2">Manage your account settings and preferences.</p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-text-muted">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Account</h2>
                </div>
                <div className="bg-surface-3 border border-surface-8 rounded-2xl p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-text-200 mb-2">Email Address</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative group">
                                {isEditingEmail ? (
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleEmailUpdate()}
                                        className="w-full bg-surface-5 border border-surface-10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text-base"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="w-full text-text-muted bg-surface-5/50 px-4 py-2.5 rounded-xl border border-surface-8 flex items-center justify-between">
                                        <span>{user.email}</span>
                                        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleEmailUpdate}
                                disabled={updatingSettings}
                                className={`px-6 py-2.5 rounded-xl transition-all font-bold text-sm min-w-[100px] flex items-center justify-center gap-2 ${
                                    isEditingEmail 
                                        ? "bg-brand-500 text-on-brand hover:bg-brand-600 shadow-lg shadow-brand-500/20" 
                                        : "bg-surface-10 text-text-base hover:bg-surface-20 border border-surface-20"
                                }`}
                            >
                                {isEditingEmail ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Edit
                                    </>
                                )}
                            </button>
                        </div>
                        {emailError && <div className="text-red-400 text-xs mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {emailError}
                        </div>}
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-text-muted">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Preferences</h2>
                </div>
                <div className="bg-surface-3 border border-surface-8 rounded-2xl p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="font-bold text-text-base">App Theme</div>
                                <div className="text-xs text-text-muted mt-1 max-w-sm">
                                    Personalize your experience with a theme that suits your style.
                                </div>
                            </div>
                            <div className="flex bg-surface-8 p-1 rounded-xl border border-surface-10">
                                {(["light", "system", "dark"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => updateSetting("theme", t)}
                                        disabled={updatingSettings}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            (settings.theme || "system") === t
                                                ? "bg-surface-3 text-brand-500 shadow-sm border border-surface-10"
                                                : "text-text-muted hover:text-text-base"
                                        }`}
                                    >
                                        {t === "light" && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>}
                                        {t === "dark" && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                                        {t === "system" && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                                        <span className="capitalize">{t}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-surface-8" />

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="font-bold text-text-base">Show Completed Default</div>
                                <div className="text-xs text-text-muted mt-1 max-w-sm">
                                    Automatically show completed tasks in your projects.
                                </div>
                            </div>
                            <button
                                onClick={() => updateSetting("showCompletedDefault", !settings.showCompletedDefault)}
                                disabled={updatingSettings}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all focus:outline-none ${
                                    settings.showCompletedDefault ? "bg-brand-500 shadow-[0_0_12px_rgba(var(--brand-500-rgb),0.3)]" : "bg-surface-10"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.showCompletedDefault ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                    {settingsError && <div className="text-red-400 text-xs flex items-center gap-1 pt-2 border-t border-surface-8">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {settingsError}
                    </div>}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-text-muted">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Security</h2>
                </div>
                <form onSubmit={handlePasswordChange} className="bg-surface-3 border border-surface-8 rounded-2xl p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-text-200">Current Password</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-surface-5 border border-surface-10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text-base placeholder:text-text-muted/30"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-text-200">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-surface-5 border border-surface-10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text-base placeholder:text-text-muted/30"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    {passwordError && <div className="text-red-400 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {passwordError}
                    </div>}
                    {passwordSuccess && <div className="text-green-500 text-xs font-bold flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Password updated successfully!
                    </div>}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-8 bg-brand-500 hover:bg-brand-600 text-on-brand font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-500/20"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
