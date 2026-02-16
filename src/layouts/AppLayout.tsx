import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { useConfig } from "../features/config/ConfigContext";

export default function AppLayout() {
    const { state, logout } = useAuth();
    const { config, status } = useConfig();
    const nav = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const user = state.status === "authenticated" ? state.user : null;
    const isReadOnly = status?.instance.readOnly;
    const isAdminPath = location.pathname.startsWith("/admin");

    const initials = useMemo(() => {
        if (!user) return "";
        return user.email.substring(0, 2);
    }, [user]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }

        document.addEventListener("pointerdown", handleClickOutside);
        return () => document.removeEventListener("pointerdown", handleClickOutside);
    }, []);

    function handleLogout() {
        setMenuOpen(false);
        logout();
        nav("/login", { replace: true });
    }

    function mailSupport() {
        setMenuOpen(false);
        window.location.href = `mailto:${config.branding.supportEmail}`;
    }

    return (
        <div className="min-h-screen bg-bg-base text-text-base selection:bg-brand-500/30">
            {isReadOnly && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2">
                    <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-black uppercase tracking-widest">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        ReadOnly Mode — No changes can be saved
                    </div>
                </div>
            )}
            <header className="sticky top-0 z-30 border-b border-surface-5 bg-bg-base/80 backdrop-blur-md">
                <div className="flex max-w-full items-center justify-between px-6 py-4">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-5 border border-surface-10 text-brand-500 shadow-sm transition-all group-hover:border-brand-500/50 group-hover:bg-brand-500/5 group-hover:scale-105">
                            <span className="text-xl font-black italic">{config.branding.appLogoInitial}</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-text-base group-hover:text-brand-600 transition-colors">
                            {config.branding.appName}
                        </span>
                    </Link>

                    {user && (
                        <div ref={menuRef} className="relative">
                            <button
                                onClick={() => setMenuOpen((open) => !open)}
                                className="group flex items-center gap-3 rounded-xl border border-surface-8 bg-surface-3 px-4 py-2 text-sm font-medium text-text-200 transition hover:bg-surface-8 hover:border-surface-15 active:scale-95 cursor-pointer"
                            >
                                <div className="h-7 w-7 rounded-full bg-surface-5 border border-surface-10 flex items-center justify-center text-[10px] text-text-muted font-bold uppercase transition-colors group-hover:border-brand-500/50 group-hover:text-brand-500">
                                    {initials}
                                </div>
                                <span className="truncate max-w-37.5">{user.email}</span>
                                <svg
                                    className={`h-4 w-4 text-text-muted transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M5 7.5L10 12.5L15 7.5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-surface-8 bg-bg-16 p-1.5 shadow-2xl shadow-black ring-1 ring-surface-10 animate-in fade-in zoom-in duration-200">
                                    <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                                        {config.navigation.userSettings.split(' ')[0]}
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link
                                            to="/settings"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-300 transition hover:bg-surface-5 hover:text-text-base cursor-pointer"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            {config.navigation.userSettings}
                                        </Link>
                                        {user.is_admin && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-300 transition hover:bg-surface-5 hover:text-text-base cursor-pointer"
                                            >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                                {config.navigation.administration}
                                            </Link>
                                        )}
                                        <button
                                            onClick={mailSupport}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-300 transition hover:bg-surface-5 hover:text-text-base cursor-pointer"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-14 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                                            {config.navigation.support}
                                        </button>
                                        <div className="my-1 border-t border-surface-5" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                            {config.navigation.logout}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className={`max-w-full px-6 py-12 ${isReadOnly && !isAdminPath ? "is-readonly" : ""}`}>
                <Outlet />
            </main>
        </div>
    );
}
