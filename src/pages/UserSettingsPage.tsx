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
        <div className="max-w-2xl mx-auto space-y-12 py-8 px-4">
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl font-black text-text-base tracking-tight italic">Settings</h1>
                <p className="text-text-muted mt-3 font-medium">Manage your workspace and security.</p>
            </div>

            <section className="space-y-5 animate-in fade-in slide-in-from-top-6 duration-700 delay-75">
                <div className="flex items-center gap-3 text-text-muted ml-1">
                    <div className="p-2 rounded-xl bg-surface-5 border border-surface-10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest">Account</h2>
                </div>
                <div className="bg-surface-3 border border-surface-8 rounded-4xl p-8 space-y-8 ring-1 ring-surface-10 shadow-sm">
                    <div className="space-y-3">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">Email Address</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative group">
                                {isEditingEmail ? (
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleEmailUpdate()}
                                        className="w-full bg-surface-5 border border-surface-15 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all text-text-base font-medium"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="w-full text-text-muted bg-surface-5/50 px-5 py-3.5 rounded-2xl border border-surface-10 flex items-center justify-between font-medium">
                                        <span>{user.email}</span>
                                        <svg className="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleEmailUpdate}
                                disabled={updatingSettings}
                                className={`px-8 py-3.5 rounded-2xl transition-all font-black uppercase tracking-widest text-sm min-w-[120px] flex items-center justify-center gap-2 cursor-pointer ${
                                    isEditingEmail 
                                        ? "bg-brand-500 text-on-brand hover:bg-brand-600 shadow-xl shadow-brand-500/20" 
                                        : "bg-surface-8 text-text-base hover:bg-surface-15 border border-surface-15 shadow-sm"
                                }`}
                            >
                                {isEditingEmail ? "Save" : "Edit"}
                            </button>
                        </div>
                        {emailError && <div className="text-red-400 text-xs mt-3 flex items-center gap-2 font-bold animate-in shake duration-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            {emailError}
                        </div>}
                    </div>
                </div>
            </section>

            <section className="space-y-5 animate-in fade-in slide-in-from-top-8 duration-700 delay-150">
                <div className="flex items-center gap-3 text-text-muted ml-1">
                    <div className="p-2 rounded-xl bg-surface-5 border border-surface-10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest">Preferences</h2>
                </div>
                <div className="bg-surface-3 border border-surface-8 rounded-4xl p-8 space-y-10 ring-1 ring-surface-10 shadow-sm">
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <div className="font-bold text-lg text-text-base tracking-tight">App Theme</div>
                                <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed max-w-xs">
                                    Personalize your workspace with a theme that fits your flow.
                                </div>
                            </div>
                            <div className="flex bg-surface-10 p-1.5 rounded-2xl border border-surface-15">
                                {(["light", "system", "dark"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => updateSetting("theme", t)}
                                        disabled={updatingSettings}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                            (settings.theme || "system") === t
                                                ? "bg-surface-3 text-brand-500 shadow-lg border border-surface-15 scale-105"
                                                : "text-text-muted hover:text-text-base"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-surface-10/50" />

                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <div className="font-bold text-lg text-text-base tracking-tight">Completed Tasks</div>
                                <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed max-w-xs">
                                    Automatically show completed tasks in your projects by default.
                                </div>
                            </div>
                            <button
                                onClick={() => updateSetting("showCompletedDefault", !settings.showCompletedDefault)}
                                disabled={updatingSettings}
                                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-all focus:outline-none cursor-pointer ${
                                    settings.showCompletedDefault ? "bg-brand-500 shadow-lg shadow-brand-500/30" : "bg-surface-15"
                                }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                                        settings.showCompletedDefault ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                    {settingsError && <div className="text-red-400 text-xs flex items-center gap-2 font-bold animate-in shake duration-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        {settingsError}
                    </div>}
                </div>
            </section>

            <section className="space-y-5 animate-in fade-in slide-in-from-top-10 duration-700 delay-300">
                <div className="flex items-center gap-3 text-text-muted ml-1">
                    <div className="p-2 rounded-xl bg-surface-5 border border-surface-10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest">Security</h2>
                </div>
                <form onSubmit={handlePasswordChange} className="bg-surface-3 border border-surface-8 rounded-4xl p-8 space-y-10 ring-1 ring-surface-10 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">Current Password</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-surface-5 border border-surface-15 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all text-text-base placeholder:text-text-muted/20 font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-surface-5 border border-surface-15 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all text-text-base placeholder:text-text-muted/20 font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                        <div className="flex-1">
                            {passwordError && <div className="text-red-400 text-xs flex items-center gap-2 font-bold animate-in shake duration-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                {passwordError}
                            </div>}
                            {passwordSuccess && <div className="text-green-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-left-4 duration-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                Updated
                            </div>}
                        </div>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-10 bg-brand-500 hover:bg-brand-600 text-on-brand font-black uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-brand-500/20 cursor-pointer"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
