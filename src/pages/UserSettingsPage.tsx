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
        <div className="max-w-2xl mx-auto space-y-12">
            <section>
                <h2 className="text-2xl font-bold mb-6">User Settings</h2>
                <div className="bg-surface-5 border border-surface-10 rounded-2xl p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
                        <div className="flex gap-2">
                            {isEditingEmail ? (
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleEmailUpdate()}
                                    className="flex-1 bg-bg-1a border border-surface-10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                                    autoFocus
                                />
                            ) : (
                                <div className="flex-1 text-text-200 bg-surface-5 px-4 py-2 rounded-lg border border-surface-5">
                                    {user.email}
                                </div>
                            )}
                            <button
                                onClick={handleEmailUpdate}
                                disabled={updatingSettings}
                                className="px-4 py-2 bg-surface-10 hover:bg-surface-20 text-text-200 rounded-lg transition-colors font-medium min-w-[80px]"
                            >
                                {isEditingEmail ? "Save" : "Edit"}
                            </button>
                        </div>
                        {emailError && <div className="text-red-400 text-sm mt-1">{emailError}</div>}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Preferences</h3>
                        
                        <div className="flex items-center justify-between p-4 bg-surface-3 rounded-xl border border-surface-5">
                            <div>
                                <div className="font-medium">App Theme</div>
                                <div className="text-xs text-text-muted text-balance">
                                    Switch between light, dark, or follow your system settings.
                                </div>
                            </div>
                            <select
                                value={settings.theme || "system"}
                                onChange={(e) => updateSetting("theme", e.target.value)}
                                disabled={updatingSettings}
                                className="bg-bg-1a border border-surface-10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                            >
                                <option value="system">System</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-surface-3 rounded-xl border border-surface-5">
                            <div>
                                <div className="font-medium">Show Completed Default</div>
                                <div className="text-xs text-text-muted">
                                    Show completed tasks by default in your lists.
                                </div>
                            </div>
                            <button
                                onClick={() => updateSetting("showCompletedDefault", !settings.showCompletedDefault)}
                                disabled={updatingSettings}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                    settings.showCompletedDefault ? "bg-brand-500" : "bg-surface-10"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.showCompletedDefault ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                        {settingsError && <div className="text-red-400 text-sm">{settingsError}</div>}
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="bg-surface-5 border border-surface-10 rounded-2xl p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-muted">Current Password</label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-bg-1a border border-surface-10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-muted">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-bg-1a border border-surface-10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        />
                    </div>
                    {passwordError && <div className="text-red-400 text-sm">{passwordError}</div>}
                    {passwordSuccess && <div className="text-green-400 text-sm">Password changed successfully!</div>}
                    <button
                        type="submit"
                        className="w-full bg-brand-500 hover:bg-brand-600 text-on-brand font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]"
                    >
                        Update Password
                    </button>
                </form>
            </section>
        </div>
    );
}
