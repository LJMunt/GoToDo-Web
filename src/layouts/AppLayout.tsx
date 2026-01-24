import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";

export default function AppLayout() {
    const { state, logout } = useAuth();
    const nav = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const user = state.status === "authenticated" ? state.user : null;

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
        window.location.href = "mailto:support@gotodo.local";
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-50 selection:bg-orange-500/30">
            <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-orange-500 shadow-sm transition-all group-hover:border-orange-500/50 group-hover:bg-orange-500/5 group-hover:scale-105">
                            <span className="text-xl font-black italic">G</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white group-hover:text-orange-50 transition-colors">
                            GoTodo
                        </span>
                    </Link>

                    {user && (
                        <div ref={menuRef} className="relative">
                            <button
                                onClick={() => setMenuOpen((open) => !open)}
                                className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:border-white/15 active:scale-95 cursor-pointer"
                            >
                                <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase transition-colors group-hover:border-orange-500/50 group-hover:text-orange-500">
                                    {user.email.substring(0, 2)}
                                </div>
                                <span className="truncate max-w-37.5">{user.email}</span>
                                <svg
                                    className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
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
                                <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-white/8 bg-[#161616] p-1.5 shadow-2xl shadow-black ring-1 ring-white/10 animate-in fade-in zoom-in duration-200">
                                    <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Account
                                    </div>
                                    <div className="space-y-0.5">
                                        <button
                                            onClick={() => setMenuOpen(false)}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white cursor-pointer"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            User Settings
                                        </button>
                                        {user.is_admin && (
                                            <button
                                                onClick={() => setMenuOpen(false)}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white cursor-pointer"
                                            >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                                Administration
                                            </button>
                                        )}
                                        <button
                                            onClick={mailSupport}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white cursor-pointer"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-14 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                                            Support
                                        </button>
                                        <div className="my-1 border-t border-white/5" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                            Log out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12">
                <Outlet />
            </main>
        </div>
    );
}
