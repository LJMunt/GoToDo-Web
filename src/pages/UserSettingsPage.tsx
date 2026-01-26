import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { changePassword } from "../api/auth";
import { updateMe } from "../api/users";

export default function UserSettingsPage() {
    const { state, refresh } = useAuth();
    const user = state.status === "authenticated" ? state.user : null;

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const [updatingSettings, setUpdatingSettings] = useState(false);
    const [settingsError, setSettingsError] = useState("");

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
        } catch (err: any) {
            setPasswordError(err.message || "Failed to change password");
        }
    }

    async function updateSetting(key: string, value: any) {
        setSettingsError("");
        setUpdatingSettings(true);
        try {
            await updateMe({
                settings: {
                    ...settings,
                    [key]: value,
                },
            });
            await refresh();
        } catch (err: any) {
            setSettingsError(err.message || "Failed to update settings");
        } finally {
            setUpdatingSettings(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-12">
            <section>
                <h2 className="text-2xl font-bold mb-6">User Settings</h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                        <div className="text-slate-200 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                            {user.email}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Preferences</h3>
                        
                        <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5">
                            <div>
                                <div className="font-medium">System Theme</div>
                                <div className="text-xs text-slate-500 text-balance">
                                    Automatically switch between light and dark themes based on your system settings. (Actual themes coming later)
                                </div>
                            </div>
                            <select
                                value={settings.theme || "system"}
                                onChange={(e) => updateSetting("theme", e.target.value)}
                                disabled={updatingSettings}
                                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            >
                                <option value="system">System</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5">
                            <div>
                                <div className="font-medium">Show Completed Default</div>
                                <div className="text-xs text-slate-500">
                                    Show completed tasks by default in your lists.
                                </div>
                            </div>
                            <button
                                onClick={() => updateSetting("showCompletedDefault", !settings.showCompletedDefault)}
                                disabled={updatingSettings}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                    settings.showCompletedDefault ? "bg-orange-500" : "bg-white/10"
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
                <form onSubmit={handlePasswordChange} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-400">Current Password</label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-400">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                    </div>
                    {passwordError && <div className="text-red-400 text-sm">{passwordError}</div>}
                    {passwordSuccess && <div className="text-green-400 text-sm">Password changed successfully!</div>}
                    <button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]"
                    >
                        Update Password
                    </button>
                </form>
            </section>
        </div>
    );
}
