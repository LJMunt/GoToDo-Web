import { useState, useEffect, FormEvent } from "react";
import { useConfig } from "../features/config/ConfigContext";
import { listOrganizations, createOrganization } from "../api/orgs";
import type { components } from "../api/schema";
import { useAuth } from "../features/auth/AuthContext";
import { OrganizationManageModal } from "./OrganizationManageModal";

type Organization = components["schemas"]["Organization"];

export default function OrganizationsPage() {
    const { config } = useConfig();
    const { refresh } = useAuth();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [managingOrg, setManagingOrg] = useState<Organization | null>(null);

    useEffect(() => {
        loadOrgs();
    }, []);

    async function loadOrgs() {
        try {
            const data = await listOrganizations();
            setOrgs(data ?? []);
        } catch (err) {
            console.error("Failed to load organizations", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;

        setCreating(true);
        try {
            await createOrganization(newName.trim());
            setNewName("");
            setShowCreate(false);
            await refresh();
            await loadOrgs();
        } catch (err) {
            console.error("Failed to create organization", err);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-base">
                        {config.ui.organizations}
                    </h1>
                    <p className="mt-1 text-sm text-text-muted">
                        {config.ui.manageOrganizations}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-on-brand shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 cursor-pointer"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    {config.ui.createOrganization}
                </button>
            </div>

            {showCreate && (
                <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-6 animate-in zoom-in duration-200">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-brand-500">
                                {config.ui.organizationName}
                            </label>
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Acme Corp"
                                className="w-full rounded-xl border border-surface-10 bg-bg-base px-4 py-3 text-sm transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="rounded-xl px-4 py-2 text-sm font-bold text-text-muted hover:text-text-base transition cursor-pointer"
                            >
                                {config.ui.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={creating || !newName.trim()}
                                className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-bold text-on-brand transition hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
                            >
                                {creating ? config.ui.saving : config.ui.createOrganization}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-sm font-bold uppercase tracking-widest text-text-muted animate-pulse">
                        {config.ui.loading}
                    </div>
                </div>
            ) : (orgs?.length ?? 0) === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-surface-10 bg-surface-3 p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-5 text-text-muted">
                        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </div>
                    <h3 className="text-lg font-bold text-text-base">No organizations yet</h3>
                    <p className="mt-1 text-sm text-text-muted">Create an organization to start collaborating with your team.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {orgs?.map((org) => (
                        <div
                            key={org.id}
                            className="group relative overflow-hidden rounded-2xl border border-surface-10 bg-surface-3 p-6 transition hover:border-brand-500/30 hover:bg-surface-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-text-base group-hover:text-brand-500 transition-colors">
                                        {org.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                                        <span className="rounded bg-surface-8 px-1.5 py-0.5">{org.workspace_id}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setManagingOrg(org)}
                                    className="rounded-xl bg-surface-8 p-2 text-text-muted transition hover:bg-surface-15 hover:text-brand-500 active:scale-95 cursor-pointer border border-surface-10"
                                    title="Manage Organization"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {managingOrg && (
                <OrganizationManageModal
                    organization={managingOrg}
                    onClose={() => setManagingOrg(null)}
                    onUpdated={() => {
                        loadOrgs();
                        refresh();
                    }}
                />
            )}
        </div>
    );
}
