import { useState, useEffect } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme, type Theme } from "../features/theme/ThemeContext";
import { useConfig } from "../features/config/ConfigContext";
import { changePassword, mfaTotpStart, mfaTotpConfirm, mfaTotpDisable } from "../api/auth";
import { updateMe, deleteMe } from "../api/users";
import type { components } from "../api/schema";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { useNavigate } from "react-router-dom";

type UserSettings = NonNullable<components["schemas"]["UserMe"]["settings"]>;

export default function UserSettingsPage() {
    const { state, refresh, logout } = useAuth();
    const { setTheme } = useTheme();
    const { language, setLanguage, config, status, availableLanguages } = useConfig();
    const user = state.status === "authenticated" ? state.user : null;
    const nav = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const [updatingSettings, setUpdatingSettings] = useState(false);
    const [settingsError, setSettingsError] = useState("");

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [mfaEnrollmentStep, setMfaEnrollmentStep] = useState<null | "qr" | "backup">(null);
    const [mfaSecret, setMfaSecret] = useState<string | null>(null);
    const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
    const [mfaBackupCodes, setMfaBackupCodes] = useState<string[] | null>(null);
    const [mfaConfirmationCode, setMfaConfirmationCode] = useState("");
    const [isConfirmingMfa, setIsConfirmingMfa] = useState(false);
    const [mfaConfirmationError, setMfaConfirmationError] = useState<string | null>(null);

    const [showMfaDisableModal, setShowMfaDisableModal] = useState(false);
    const [mfaDisableConfirmed, setMfaDisableConfirmed] = useState(false);
    const [isDisablingMfa, setIsDisablingMfa] = useState(false);
    const [mfaDisableError, setMfaDisableError] = useState<string | null>(null);

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
            setTimeout(() => {
                logout();
            }, 1000);
        } catch (err: unknown) {
            setPasswordError(err instanceof Error ? err.message : "Failed to change password");
        }
    }

    const [stagedSettings, setStagedSettings] = useState<UserSettings | null>(null);

    async function updateSetting(key: string, value: string | boolean) {
        setSettingsError("");
        if (key === "theme") {
            setTheme(value as Theme);
        }
        setStagedSettings((prev) => ({
            ...(prev || settings),
            [key]: value,
        } as UserSettings));
    }

    useEffect(() => {
        if (!stagedSettings) return;

        const t = setTimeout(async () => {
            const toSend = stagedSettings;
            setUpdatingSettings(true);
            try {
                await updateMe({ settings: toSend });
                await refresh();
                setStagedSettings((prev) => (prev === toSend ? null : prev));
            } catch (err: unknown) {
                setSettingsError(err instanceof Error ? err.message : "Failed to update settings");
            } finally {
                setUpdatingSettings(false);
            }
        }, 500);
        return () => clearTimeout(t);
    }, [stagedSettings, refresh]);

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

    async function handleDeleteAccount(e: React.FormEvent) {
        e.preventDefault();
        if (!deleteConfirmed) return;
        setDeleteError("");
        setIsDeleting(true);
        try {
            await deleteMe(deletePassword);
            logout();
            nav("/login", { replace: true });
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
            setIsDeleting(false);
        }
    }

    async function handleStartMfaEnrollment() {
        try {
            const res = await mfaTotpStart();
            setMfaSecret(res.secret);
            setMfaQrCode(res.url);
            setMfaEnrollmentStep("qr");
            setMfaConfirmationCode("");
            setMfaConfirmationError(null);
        } catch (err: unknown) {
            setSettingsError(err instanceof Error ? err.message : "Failed to start MFA enrollment");
        }
    }

    async function handleConfirmMfa() {
        setMfaConfirmationError(null);
        setIsConfirmingMfa(true);
        try {
            const res = await mfaTotpConfirm({ code: mfaConfirmationCode });
            setMfaBackupCodes(res.backup_codes);
            setMfaEnrollmentStep("backup");
            await refresh();
        } catch (err: unknown) {
            setMfaConfirmationError(err instanceof Error ? err.message : "Failed to confirm MFA");
        } finally {
            setIsConfirmingMfa(false);
        }
    }

    async function handleDisableMfa() {
        setMfaDisableError(null);
        setIsDisablingMfa(true);
        try {
            await mfaTotpDisable();
            await refresh();
            setShowMfaDisableModal(false);
            setMfaDisableConfirmed(false);
        } catch (err: unknown) {
            setMfaDisableError(err instanceof Error ? err.message : "Failed to disable MFA");
        } finally {
            setIsDisablingMfa(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-12 py-8 px-4">
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl font-black text-text-base tracking-tight italic">{config.ui.settingsTitle}</h1>
                <p className="text-text-muted mt-3 font-medium">{config.ui.settingsSubtitle}</p>
            </div>

            <section className="space-y-5 animate-in fade-in slide-in-from-top-6 duration-700 delay-75">
                <div className="flex items-center gap-3 text-text-muted ml-1">
                    <div className="p-2 rounded-xl bg-surface-5 border border-surface-10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest">{config.ui.account}</h2>
                </div>
                <div className="bg-surface-3 border border-surface-8 rounded-4xl p-8 space-y-8 ring-1 ring-surface-10 shadow-sm">
                    <div className="space-y-3">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">{config.auth.emailLabel}</label>
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
                                {isEditingEmail ? config.ui.save : config.ui.edit}
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
                    <h2 className="text-xs font-black uppercase tracking-widest">{config.ui.preferences}</h2>
                </div>
                <div className="bg-surface-3 border border-surface-8 rounded-4xl p-8 space-y-10 ring-1 ring-surface-10 shadow-sm">
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <div className="font-bold text-lg text-text-base tracking-tight">{config.ui.appTheme}</div>
                                <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed max-w-xs">
                                    {config.ui.themeDescription}
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
                                <div className="font-bold text-lg text-text-base tracking-tight">{config.ui.completedTasks}</div>
                                <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed max-w-xs">
                                    {config.ui.completedTasksDescription}
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

                        <div className="h-px bg-surface-10/50" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <div className="font-bold text-lg text-text-base tracking-tight">{config.ui.language}</div>
                                <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed max-w-xs">
                                    {config.ui.languageDescription}
                                </div>
                            </div>
                            <div className="flex flex-wrap bg-surface-10 p-1 rounded-xl border border-surface-15 gap-1">
                                {availableLanguages.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => setLanguage(l.code)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                            language === l.code
                                                ? "bg-surface-3 text-brand-500 shadow-sm border border-surface-15 scale-105"
                                                : "text-text-muted hover:text-text-base"
                                        }`}
                                    >
                                        {language === l.code ? l.name : l.code}
                                    </button>
                                ))}
                            </div>
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
                    <h2 className="text-xs font-black uppercase tracking-widest">{config.ui.security}</h2>
                </div>
                <form onSubmit={handlePasswordChange} className="bg-surface-3 border border-surface-8 rounded-4xl p-8 space-y-10 ring-1 ring-surface-10 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">{config.auth.currentPasswordLabel}</label>
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
                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">{config.auth.newPasswordLabel}</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-surface-5 border border-surface-15 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all text-text-base placeholder:text-text-muted/20 font-medium"
                                placeholder="••••••••"
                            />
                            <PasswordRequirements password={newPassword} />
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
                                {config.ui.updatedSuccess}
                            </div>}
                        </div>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-10 bg-brand-500 hover:bg-brand-600 text-on-brand font-black uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-brand-500/20 cursor-pointer"
                        >
                            {config.ui.updatePasswordButton}
                        </button>
                        {!user.is_admin && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full sm:w-auto px-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-[0.98] border border-red-500/20 cursor-pointer"
                            >
                                {config.ui.deleteAccountButton}
                            </button>
                        )}
                    </div>
                </form>
                {status?.auth.allowTOTP && (
                    <div className="bg-surface-3 border border-surface-8 rounded-4xl p-8 space-y-6 ring-1 ring-surface-10 shadow-sm mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <div className="font-bold text-lg text-text-base tracking-tight">{config.ui.twoFactorAuth}</div>
                                <div className="text-xs text-text-muted mt-1.5 font-medium leading-relaxed max-w-xs">
                                    {config.ui.twoFactorAuthDescription}
                                </div>
                            </div>
                            {user.mfa_enabled ? (
                                <button
                                    onClick={() => setShowMfaDisableModal(true)}
                                    className="px-8 py-3.5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase tracking-widest text-sm hover:bg-red-500/20 transition-all cursor-pointer"
                                >
                                    {config.ui.disableMfa}
                                </button>
                            ) : (
                                <button
                                    onClick={handleStartMfaEnrollment}
                                    className="px-8 py-3.5 rounded-2xl bg-brand-500 text-on-brand font-black uppercase tracking-widest text-sm hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 cursor-pointer"
                                >
                                    {config.ui.setupMfa}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {mfaEnrollmentStep && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-surface-15">
                        <div className="p-10">
                            {mfaEnrollmentStep === "qr" && (
                                <div className="space-y-8 text-center">
                                    <div>
                                        <h2 className="text-3xl font-bold text-text-base tracking-tight">{config.ui.mfaEnrollmentTitle}</h2>
                                        <p className="text-text-muted mt-2 font-medium">{config.ui.mfaEnrollmentSubtitle}</p>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="bg-white p-4 rounded-3xl shadow-2xl ring-4 ring-brand-500/20 transition-transform hover:scale-105 duration-500">
                                            {mfaQrCode && (
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(mfaQrCode)}&size=200x200&bgcolor=ffffff&color=000000&margin=1`} 
                                                    alt="MFA QR Code"
                                                    className="w-48 h-48"
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-2 w-full">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{config.ui.scanQrCode}</div>
                                            <div className="bg-surface-5 border border-surface-10 rounded-2xl px-4 py-3 font-mono text-sm tracking-widest text-brand-500 break-all select-all">
                                                {mfaSecret}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-left">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">{config.ui.mfaCodeConfirmLabel}</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={6}
                                                required
                                                value={mfaConfirmationCode}
                                                onChange={(e) => setMfaConfirmationCode(e.target.value.replace(/\D/g, ""))}
                                                className="w-full bg-surface-5 border border-surface-15 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all text-text-base text-center text-2xl tracking-[0.5em] font-bold"
                                                placeholder="000000"
                                                autoFocus
                                            />
                                        </div>

                                        {mfaConfirmationError && (
                                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-bold animate-in shake duration-500">
                                                {mfaConfirmationError}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setMfaEnrollmentStep(null)}
                                                className="flex-1 rounded-2xl px-6 py-4 text-sm font-bold text-text-muted hover:bg-surface-8 hover:text-text-base transition-all"
                                            >
                                                {config.ui.cancel}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={mfaConfirmationCode.length !== 6 || isConfirmingMfa}
                                                onClick={handleConfirmMfa}
                                                className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-brand-500/20 hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                {isConfirmingMfa ? (
                                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                ) : config.ui.mfaCodeConfirmButton}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mfaEnrollmentStep === "backup" && (
                                <div className="space-y-8">
                                    <div className="text-center">
                                        <h2 className="text-3xl font-bold text-text-base tracking-tight">{config.ui.mfaBackupCodesTitle}</h2>
                                        <p className="text-text-muted mt-2 font-medium">{config.ui.mfaBackupCodesSubtitle}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {mfaBackupCodes?.map((code, i) => (
                                            <div key={i} className="bg-surface-5 border border-surface-10 rounded-2xl px-4 py-3 font-mono text-sm text-center text-text-base tracking-widest">
                                                {code}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setMfaEnrollmentStep(null)}
                                            className="w-full rounded-2xl bg-brand-500 px-6 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-brand-500/20 hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                                        >
                                            {config.ui.doneButton}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showMfaDisableModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-red-500/20 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-red-500/10">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-red-500 tracking-tight">{config.ui.disableMfaConfirmTitle}</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowMfaDisableModal(false);
                                        setMfaDisableConfirmed(false);
                                        setMfaDisableError(null);
                                    }}
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all border border-surface-10"
                                >
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            <p className="text-text-muted mb-8 font-medium leading-relaxed">
                                {config.ui.disableMfaConfirmMessage}
                            </p>

                            <div className="space-y-8">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all ${mfaDisableConfirmed ? "border-red-500 bg-red-500/10 text-red-500" : "border-surface-10 group-hover:border-surface-15"}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={mfaDisableConfirmed}
                                            onChange={(e) => setMfaDisableConfirmed(e.target.checked)}
                                        />
                                        {mfaDisableConfirmed && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                    </div>
                                    <span className="text-sm font-bold text-text-muted group-hover:text-text-base transition-colors leading-tight">
                                        {config.ui.disableMfaAgreement}
                                    </span>
                                </label>

                                {mfaDisableError && (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-bold animate-in shake duration-500">
                                        {mfaDisableError}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowMfaDisableModal(false)}
                                        className="flex-1 rounded-2xl px-8 py-4 text-sm font-bold text-text-muted hover:bg-surface-8 hover:text-text-base transition-all"
                                    >
                                        {config.ui.cancel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDisableMfa}
                                        disabled={!mfaDisableConfirmed || isDisablingMfa}
                                        className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-red-500/20 hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {isDisablingMfa ? (
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : config.ui.disableMfa}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-red-500/20 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-red-500/10">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-red-500 tracking-tight">{config.ui.deleteAccountTitle}</h2>
                                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-2">
                                        {config.ui.deleteAccountPermanent}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword("");
                                        setDeleteConfirmed(false);
                                        setDeleteError("");
                                    }}
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all border border-surface-10"
                                >
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            <p className="text-text-muted mb-8 font-medium leading-relaxed">
                                {config.ui.deleteAccountConfirmation}
                            </p>

                            <form onSubmit={handleDeleteAccount} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black uppercase tracking-widest text-text-muted ml-1">{config.ui.confirmPasswordLabel}</label>
                                    <input
                                        type="password"
                                        required
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all text-text-base placeholder:text-text-muted/20 font-medium"
                                        placeholder={config.ui.enterPasswordPlaceholder}
                                        autoFocus
                                    />
                                </div>

                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all ${deleteConfirmed ? "border-red-500 bg-red-500/10 text-red-500" : "border-surface-10 group-hover:border-surface-15"}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={deleteConfirmed}
                                            onChange={(e) => setDeleteConfirmed(e.target.checked)}
                                        />
                                        {deleteConfirmed && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                    </div>
                                    <span className="text-sm font-bold text-text-muted group-hover:text-text-base transition-colors leading-tight">
                                        {config.ui.deleteAccountAgreement}
                                    </span>
                                </label>

                                {deleteError && (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-bold animate-in shake duration-500">
                                        {deleteError}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 rounded-2xl px-8 py-4 text-sm font-bold text-text-muted hover:bg-surface-8 hover:text-text-base transition-all"
                                    >
                                        {config.ui.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!deleteConfirmed || !deletePassword || isDeleting}
                                        className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-red-500/20 hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {isDeleting ? (
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : config.ui.deleteAccountButton}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
