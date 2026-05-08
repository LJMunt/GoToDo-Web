import { useEffect, useRef, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { useConfig } from "../features/config/ConfigContext";
import { useTaskStore } from "../stores/taskStore";
import { useNavigate } from "react-router-dom";
import { OrganizationCreateModal } from "./OrganizationCreateModal";

export function WorkspaceSwitcher() {
    const { state, setWorkspaceId, refresh } = useAuth();
    const { status } = useConfig();
    const { clearAll } = useTaskStore();
    const nav = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const user = state.status === "authenticated" ? state.user : null;
    const activeWorkspaceId = state.status === "authenticated" ? state.workspaceId : null;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user || !status?.features.organizations) return null;

    const workspaces = user.workspaces || [];
    const personalWorkspace = workspaces.find(w => w.type === "user") || workspaces[0];
    const orgWorkspaces = workspaces.filter(w => w.type === "org");
    
    const activeWorkspace = workspaces.find(w => w.public_id === activeWorkspaceId);
    const isPersonal = !activeWorkspaceId || activeWorkspaceId === personalWorkspace?.public_id;
    
    const currentWorkspace = {
        name: isPersonal ? "Personal Workspace" : (activeWorkspace?.name || "Organization Workspace"),
        type: isPersonal ? "user" : "org" as const
    };

    function handleSwitch(workspaceId: string) {
        let targetId: string | null = workspaceId;
        if (targetId === "null" || targetId === "undefined" || !targetId || targetId === personalWorkspace?.public_id) {
            targetId = null;
        }

        if (targetId === activeWorkspaceId) {
            setMenuOpen(false);
            return;
        }
        setWorkspaceId(targetId);
        clearAll();
        setMenuOpen(false);
        nav("/");
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 rounded-xl border border-surface-8 bg-surface-3 px-4 py-2 text-sm font-medium text-text-200 transition hover:bg-surface-8 hover:border-surface-15 active:scale-95 cursor-pointer"
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {currentWorkspace.type === "user" ? (
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        ) : (
                            <path d="M3 21v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" />
                        )}
                        {currentWorkspace.type === "user" ? <circle cx="12" cy="7" r="4" /> : <path d="M7 7a4 4 0 1 1 10 0" />}
                    </svg>
                </div>
                <span className="truncate max-w-40 font-bold text-text-base">{currentWorkspace.name}</span>
                <svg
                    className={`h-4 w-4 text-text-muted transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {menuOpen && (
                <div className="absolute left-0 mt-3 w-72 overflow-hidden rounded-2xl border border-surface-8 bg-bg-16 p-1.5 shadow-2xl shadow-black ring-1 ring-surface-10 animate-in fade-in zoom-in duration-200 z-50">
                    <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        Personal
                    </div>
                    <button
                        onClick={() => handleSwitch(personalWorkspace?.public_id ?? "")}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition cursor-pointer ${
                            isPersonal 
                                ? "bg-brand-500/10 text-brand-500 font-bold" 
                                : "text-text-300 hover:bg-surface-5 hover:text-text-base"
                        }`}
                    >
                        <div className={`h-2 w-2 rounded-full ${isPersonal ? "bg-brand-500" : "bg-transparent"}`} />
                        Personal Workspace
                    </button>

                    {orgWorkspaces.length > 0 && (
                        <>
                            <div className="mt-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                                Organizations
                            </div>
                            <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                {orgWorkspaces.map(ws => {
                                    const isSelected = activeWorkspaceId === ws.public_id;
                                    return (
                                        <button
                                            key={ws.public_id}
                                            onClick={() => handleSwitch(ws.public_id)}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition cursor-pointer ${
                                                isSelected 
                                                    ? "bg-brand-500/10 text-brand-500 font-bold" 
                                                    : "text-text-300 hover:bg-surface-5 hover:text-text-base"
                                            }`}
                                        >
                                            <div className={`h-2 w-2 rounded-full ${isSelected ? "bg-brand-500" : "bg-transparent"}`} />
                                            <span className="truncate">{ws.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <div className="my-1.5 border-t border-surface-5" />
                    <button
                        onClick={() => { setMenuOpen(false); nav("/organizations"); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-text-300 font-medium transition hover:bg-surface-5 hover:text-text-base cursor-pointer"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Manage Organizations
                    </button>
                    <button
                        onClick={() => { setMenuOpen(false); setShowCreateModal(true); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-brand-500 font-bold transition hover:bg-brand-500/10 cursor-pointer"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create Organization
                    </button>
                </div>
            )}

            {showCreateModal && (
                <OrganizationCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(workspaceId) => {
                        refresh().then(() => {
                            handleSwitch(workspaceId);
                        });
                    }}
                />
            )}
        </div>
    );
}
