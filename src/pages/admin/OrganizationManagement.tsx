import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listOrganizations, updateOrganization, deleteOrganization, restoreOrganization, type Organization } from "../../api/admin";
import { useConfig } from "../../features/config/ConfigContext";

function SortIcon({ field, currentField, direction }: { field: keyof Organization, currentField: keyof Organization, direction: "asc" | "desc" }) {
    if (field !== currentField) {
        return (
            <svg className="w-3 h-3 opacity-0 group-hover:opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        );
    }
    return (
        <svg className="w-3 h-3 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {direction === "asc" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
        </svg>
    );
}

export default function OrganizationManagement() {
    const navigate = useNavigate();
    const { config } = useConfig();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "deleted">("all");
    const [sortField, setSortField] = useState<keyof Organization>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const data = await listOrganizations();
                setOrgs(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch organizations");
            } finally {
                setLoading(false);
            }
        };
        fetchOrgs();
    }, []);

    const toggleSort = (field: keyof Organization) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleUpdateName = async () => {
        if (!editingOrg || !newName.trim()) return;
        setIsUpdating(true);
        try {
            const updated = await updateOrganization(editingOrg.id, { name: newName });
            setOrgs(orgs.map(o => o.id === editingOrg.id ? updated : o));
            setEditingOrg(null);
            setNewName("");
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to update organization");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (org: Organization) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete organization "${org.name}"? This action cannot be undone.`)) return;
        setIsUpdating(true);
        try {
            await deleteOrganization(org.id);
            setOrgs(orgs.filter(o => o.id !== org.id));
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to delete organization");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRestore = async (org: Organization) => {
        setIsUpdating(true);
        try {
            await restoreOrganization(org.id);
            // Refresh to get updated deleted_at
            const data = await listOrganizations();
            setOrgs(data);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to restore organization");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredOrgs = useMemo(() => {
        const filtered = orgs.filter(org => {
            const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) || 
                                 org.id.toString().includes(search) ||
                                 org.workspace_id.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = filterStatus === "all" || 
                                 (filterStatus === "active" && !org.deleted_at) || 
                                 (filterStatus === "deleted" && org.deleted_at);
            return matchesSearch && matchesStatus;
        });

        return [...filtered].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (valA === null || valA === undefined) return sortDirection === "asc" ? -1 : 1;
            if (valB === null || valB === undefined) return sortDirection === "asc" ? 1 : -1;

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [orgs, search, filterStatus, sortField, sortDirection]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-base transition-none!">Organization Management</h1>
                <p className="text-sm text-text-muted mt-1">Manage all organizations and their resources.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted group-focus-within:text-brand-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={config.ui.searchPlaceholder}
                        className="w-full bg-surface-3 border border-surface-8 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 text-text-base placeholder:text-text-muted/50 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <select
                            className="w-full bg-surface-3 border border-surface-8 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 text-text-base appearance-none cursor-pointer hover:border-surface-20 transition-all"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "deleted")}
                        >
                            <option value="all">{config.ui.allStatus}</option>
                            <option value="active">{config.ui.active}</option>
                            <option value="deleted">Deleted</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-surface-8 bg-surface-3">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                            <tr>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("id")}>
                                    <div className="flex items-center gap-1">
                                        {config.ui.id}
                                        <SortIcon field="id" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("name")}>
                                    <div className="flex items-center gap-1">
                                        Name
                                        <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("workspace_id")}>
                                    <div className="flex items-center gap-1">
                                        Workspace ID
                                        <SortIcon field="workspace_id" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("deleted_at")}>
                                    <div className="flex items-center gap-1">
                                        {config.ui.status}
                                        <SortIcon field="deleted_at" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("created_at")}>
                                    <div className="flex items-center gap-1">
                                        Created
                                        <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">
                                    {config.ui.actions}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-8">
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="hover:bg-surface-5/50 transition-colors group/row">
                                    <td className="px-4 py-4 font-mono text-xs text-text-muted">#{org.id}</td>
                                    <td className="px-4 py-4 font-medium text-text-base">
                                        <button 
                                            onClick={() => {
                                                setEditingOrg(org);
                                                setNewName(org.name);
                                            }}
                                            className="hover:text-brand-500 transition-colors cursor-pointer text-left"
                                        >
                                            {org.name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 font-mono text-[10px] text-text-muted">{org.workspace_id}</td>
                                    <td className="px-4 py-4">
                                        {org.deleted_at ? (
                                            <span className="inline-flex items-center gap-1.5 text-red-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                Deleted
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-green-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                                {config.ui.active}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                        {new Date(org.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/admin/organizations/${org.id}/projects`)}
                                                className="p-1.5 rounded-lg bg-surface-5 text-text-muted hover:text-brand-500 hover:bg-brand-500/10 transition-all cursor-pointer active:scale-95"
                                                title="View Projects"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/organizations/${org.id}/tasks`)}
                                                className="p-1.5 rounded-lg bg-surface-5 text-text-muted hover:text-brand-500 hover:bg-brand-500/10 transition-all cursor-pointer active:scale-95"
                                                title="View Tasks"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/organizations/${org.id}/tags`)}
                                                className="p-1.5 rounded-lg bg-surface-5 text-text-muted hover:text-brand-500 hover:bg-brand-500/10 transition-all cursor-pointer active:scale-95"
                                                title="View Tags"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </button>
                                            {org.deleted_at ? (
                                                <button
                                                    onClick={() => handleRestore(org)}
                                                    disabled={isUpdating}
                                                    className="p-1.5 rounded-lg bg-surface-5 text-green-500 hover:bg-green-500/10 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                                                    title="Restore Organization"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDelete(org)}
                                                    disabled={isUpdating}
                                                    className="p-1.5 rounded-lg bg-surface-5 text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                                                    title="Permanent Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredOrgs.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-5 text-text-muted mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-text-base">No organizations found</h3>
                        <p className="text-xs text-text-muted mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>

            {editingOrg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-text-base">Rename Organization</h2>
                                    <p className="text-sm text-text-muted mt-1">Change the public name of this organization.</p>
                                </div>
                                <button
                                    onClick={() => setEditingOrg(null)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">New Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-surface-3 border border-surface-8 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 text-text-base transition-all"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 bg-surface-3 p-6 border-t border-surface-8">
                            <button
                                onClick={() => setEditingOrg(null)}
                                className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-base transition-colors"
                            >
                                {config.ui.cancel}
                            </button>
                            <button
                                onClick={handleUpdateName}
                                disabled={isUpdating || !newName.trim() || newName === editingOrg.name}
                                className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-bold text-on-brand shadow-lg shadow-brand-500/10 hover:bg-brand-600 transition-all disabled:opacity-50"
                            >
                                {isUpdating ? config.ui.saving : config.ui.saveChanges}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
