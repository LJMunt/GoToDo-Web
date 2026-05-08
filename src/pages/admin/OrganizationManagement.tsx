import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listOrganizations, updateOrganization, deleteOrganizationPermanent, restoreOrganization, type Organization } from "../../api/admin";
import { deleteOrg } from "../../api/orgs";
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
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "deleted">("all");
    const [sortField, setSortField] = useState<keyof Organization>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const data = await listOrganizations(true);
                setOrganizations(data);
            } catch (e) {
                console.error("Failed to fetch organizations:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrgs();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => {
            if (activeDropdown !== null) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [activeDropdown]);

    const toggleSort = (field: keyof Organization) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleSoftDelete = async (org: Organization) => {
        if (!confirm(`Are you sure you want to soft delete "${org.name}"?`)) return;
        setIsUpdating(true);
        try {
            await deleteOrg(org.id);
            setOrganizations(organizations.map(o => o.id === org.id ? { ...o, deleted_at: new Date().toISOString() } : o));
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to delete organization");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePermanentDelete = async (org: Organization) => {
        if (!confirm(`PERMANENT DELETE: Are you sure you want to permanently delete "${org.name}"? This cannot be undone.`)) return;
        setIsUpdating(true);
        try {
            await deleteOrganizationPermanent(org.id);
            setOrganizations(organizations.filter(o => o.id !== org.id));
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to permanently delete organization");
        } finally {
            setIsUpdating(false);
            setDeletingOrg(null);
        }
    };

    const handleRestore = async (org: Organization) => {
        setIsUpdating(true);
        try {
            await restoreOrganization(org.id);
            setOrganizations(organizations.map(o => o.id === org.id ? { ...o, deleted_at: null } : o));
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to restore organization");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingOrg || !newName.trim()) return;
        setIsUpdating(true);
        try {
            await updateOrganization(editingOrg.id, { name: newName });
            setOrganizations(organizations.map(o => o.id === editingOrg.id ? { ...o, name: newName } : o));
            setEditingOrg(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to update organization");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredOrgs = useMemo(() => {
        return organizations
            .filter(org => {
                const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) || 
                                     org.workspace_id.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = filterStatus === "all" || 
                                     (filterStatus === "active" && !org.deleted_at) || 
                                     (filterStatus === "deleted" && org.deleted_at);
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const valA = a[sortField];
                const valB = b[sortField];
                if (valA === null || valA === undefined) return sortDirection === "asc" ? -1 : 1;
                if (valB === null || valB === undefined) return sortDirection === "asc" ? 1 : -1;
                
                if (valA < valB) return sortDirection === "asc" ? -1 : 1;
                if (valA > valB) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
    }, [organizations, search, filterStatus, sortField, sortDirection]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-text-muted">{config.ui.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-base">Organization Management</h1>
                    <p className="text-sm text-text-muted mt-1">Manage all organizations in the system.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        className="w-full bg-surface-3 border border-surface-8 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 text-text-base placeholder:text-text-muted/50 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <select
                        className="w-full bg-surface-3 border border-surface-8 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 text-text-base appearance-none cursor-pointer hover:border-surface-20 transition-all"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "deleted")}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="deleted">Deleted Only</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
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
                                        ID <SortIcon field="id" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("name")}>
                                    <div className="flex items-center gap-1">
                                        Name <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("workspace_id")}>
                                    <div className="flex items-center gap-1">
                                        Workspace ID <SortIcon field="workspace_id" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("created_at")}>
                                    <div className="flex items-center gap-1">
                                        Created At <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("deleted_at")}>
                                    <div className="flex items-center gap-1">
                                        Status <SortIcon field="deleted_at" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-8">
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="hover:bg-surface-5/50 transition-colors group/row">
                                    <td className="px-4 py-4 font-mono text-xs text-text-muted">#{org.id}</td>
                                    <td className="px-4 py-4 font-medium text-text-base">{org.name}</td>
                                    <td className="px-4 py-4 font-mono text-xs text-text-muted">{org.workspace_id}</td>
                                    <td className="px-4 py-4 text-text-muted">{new Date(org.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-4">
                                        {org.deleted_at ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                                                Deleted
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === org.id ? null : org.id);
                                                }}
                                                className="p-2 hover:bg-surface-8 rounded-lg transition-colors text-text-muted hover:text-text-base"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>

                                            {activeDropdown === org.id && (
                                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-3 border border-surface-8 shadow-xl z-10 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <button
                                                        onClick={() => navigate(`/admin/orgs/${org.id}/members`)}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-base hover:bg-surface-8 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                        Manage Data
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingOrg(org);
                                                            setNewName(org.name);
                                                        }}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-base hover:bg-surface-8 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Rename
                                                    </button>
                                                    {org.deleted_at ? (
                                                        <button
                                                            onClick={() => handleRestore(org)}
                                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-500 hover:bg-green-500/5 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSoftDelete(org)}
                                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Soft Delete
                                                        </button>
                                                    )}
                                                    <div className="my-1 border-t border-surface-8"></div>
                                                    <button
                                                        onClick={() => setDeletingOrg(org)}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-600/5 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                                        </svg>
                                                        Permanent Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rename Modal */}
            {editingOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-surface-3 border border-surface-8 rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-text-base mb-4">Rename Organization</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">New Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-surface-5 border border-surface-8 rounded-xl px-4 py-2.5 text-sm text-text-base focus:outline-none focus:border-brand-500"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setEditingOrg(null)}
                                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="bg-brand-500 hover:bg-brand-600 text-on-brand px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all"
                            >
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permanent Delete Modal */}
            {deletingOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-surface-3 border border-red-500/20 rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-xl font-bold">Permanent Delete</h3>
                        </div>
                        <p className="text-text-base mb-2 font-medium">Are you absolutely sure?</p>
                        <p className="text-sm text-text-muted mb-6">
                            This will permanently delete <span className="text-text-base font-bold">"{deletingOrg.name}"</span> and all its projects, tasks, and data. This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingOrg(null)}
                                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePermanentDelete(deletingOrg)}
                                disabled={isUpdating}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all"
                            >
                                {isUpdating ? "Deleting..." : "Permanently Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
