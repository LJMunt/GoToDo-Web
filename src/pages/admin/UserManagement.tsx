import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listUsers, updateUser, verifyUserEmail, unverifyUserEmail, type User } from "../../api/admin";
import { useAuth } from "../../features/auth/AuthContext";
import { useConfig } from "../../features/config/ConfigContext";

function SortIcon({ field, currentField, direction }: { field: keyof User, currentField: keyof User, direction: "asc" | "desc" }) {
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

export default function UserManagement() {
    const navigate = useNavigate();
    const { state: authState } = useAuth();
    const { config } = useConfig();
    const currentUser = authState.status === "authenticated" ? authState.user : null;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterAdmin, setFilterAdmin] = useState<"all" | "admin" | "user">("all");
    const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
    const [sortField, setSortField] = useState<keyof User>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleVerifyEmail = async (user: User) => {
        setIsUpdating(true);
        try {
            if (user.email_verified_at) {
                await unverifyUserEmail(user.id);
                setUsers(users.map(u => u.id === user.id ? { ...u, email_verified_at: null } : u));
            } else {
                await verifyUserEmail(user.id);
                setUsers(users.map(u => u.id === user.id ? { ...u, email_verified_at: new Date().toISOString() } : u));
            }
            setVerifyingUser(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to update verification status");
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await listUsers();
                setUsers(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
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

    const toggleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleUpdateStatus = async (user: User, active: boolean) => {
        if (currentUser?.id === user.id && !active) {
            alert("You cannot inactivate your own account.");
            return;
        }
        setIsUpdating(true);
        try {
            await updateUser(user.id, { is_active: active });
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: active } : u));
            setEditingUser(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to update user");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const filtered = users.filter(user => {
            const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) || 
                                 user.id.toString().includes(search);
            const matchesAdmin = filterAdmin === "all" || 
                                (filterAdmin === "admin" && user.is_admin) || 
                                (filterAdmin === "user" && !user.is_admin);
            const matchesActive = filterActive === "all" || 
                                 (filterActive === "active" && user.is_active) || 
                                 (filterActive === "inactive" && !user.is_active);
            return matchesSearch && matchesAdmin && matchesActive;
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
    }, [users, search, filterAdmin, filterActive, sortField, sortDirection]);

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
                <h1 className="text-2xl font-bold text-text-base transition-none!">{config.ui.userManagementTitle}</h1>
                <p className="text-sm text-text-muted mt-1">{config.ui.userManagementSubtitle}</p>
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
                            value={filterAdmin}
                            onChange={(e) => setFilterAdmin(e.target.value as "all" | "admin" | "user")}
                        >
                            <option value="all">{config.ui.allRoles}</option>
                            <option value="admin">{config.ui.adminsOnly}</option>
                            <option value="user">{config.ui.usersOnly}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <div className="relative flex-1 md:flex-none">
                        <select
                            className="w-full bg-surface-3 border border-surface-8 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 text-text-base appearance-none cursor-pointer hover:border-surface-20 transition-all"
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
                        >
                            <option value="all">{config.ui.allStatus}</option>
                            <option value="active">{config.ui.active}</option>
                            <option value="inactive">{config.ui.inactive}</option>
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
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("email")}>
                                    <div className="flex items-center gap-1">
                                        {config.ui.email}
                                        <SortIcon field="email" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("is_admin")}>
                                    <div className="flex items-center gap-1">
                                        {config.ui.role}
                                        <SortIcon field="is_admin" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("is_active")}>
                                    <div className="flex items-center gap-1">
                                        {config.ui.status}
                                        <SortIcon field="is_active" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("last_login")}>
                                    <div className="flex items-center gap-1">
                                        {config.ui.lastLogin}
                                        <SortIcon field="last_login" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("email_verified_at")}>
                                    <div className="flex items-center gap-1">
                                        {config.ui.emailVerified}
                                        <SortIcon field="email_verified_at" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">
                                    {config.ui.actions}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-8">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-5/50 transition-colors group/row">
                                    <td className="px-4 py-4 font-mono text-xs text-text-muted">#{user.id}</td>
                                    <td className="px-4 py-4 font-medium text-text-base relative">
                                        <div className="flex items-center gap-2">
                                            {user.email}
                                            {currentUser?.id === user.id && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-md border border-brand-500/20">
                                                    {config.ui.you}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {user.is_admin ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                {config.ui.adminRole}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-text-muted border border-surface-20">
                                                {config.ui.userRole}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button 
                                            onClick={() => setEditingUser(user)}
                                            className="group/status focus:outline-none transition-all active:scale-95 cursor-pointer px-2 py-1 -mx-2 rounded-lg hover:bg-surface-10"
                                            title="Change user status"
                                        >
                                            {user.is_active ? (
                                                <span className="flex items-center gap-1.5 text-green-500 group-hover/status:text-green-400 transition-colors">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                                    {config.ui.active}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-text-muted group-hover/status:text-red-400 transition-colors">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {config.ui.inactive}
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                        {user.last_login ? new Date(user.last_login).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : (
                                            <span className="italic text-text-muted/50">{config.ui.never}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => setVerifyingUser(user)}
                                            disabled={isUpdating}
                                            className="text-xs font-medium focus:outline-none transition-all active:scale-95 cursor-pointer px-2 py-1 -mx-2 rounded-lg hover:bg-surface-10 disabled:opacity-50"
                                            title={user.email_verified_at ? config.ui.unverifyEmail : config.ui.verifyEmail}
                                        >
                                            {user.email_verified_at ? (
                                                <span className="text-brand-500 hover:text-brand-400">
                                                    {new Date(user.email_verified_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                            ) : (
                                                <span className="italic text-text-muted/50 hover:text-text-muted">
                                                    {config.ui.never}
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/admin/users/${user.id}/projects`)}
                                                className="p-1.5 rounded-lg bg-surface-5 text-text-muted hover:text-brand-500 hover:bg-brand-500/10 transition-all cursor-pointer"
                                                title="View Projects"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/users/${user.id}/tasks`)}
                                                className="p-1.5 rounded-lg bg-surface-5 text-text-muted hover:text-brand-500 hover:bg-brand-500/10 transition-all cursor-pointer"
                                                title="View Tasks"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/users/${user.id}/tags`)}
                                                className="p-1.5 rounded-lg bg-surface-5 text-text-muted hover:text-brand-500 hover:bg-brand-500/10 transition-all cursor-pointer"
                                                title="View Tags"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-5 text-text-muted mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-text-base">{config.ui.noUsersFound}</h3>
                        <p className="text-xs text-text-muted mt-1">{config.ui.noUsersFoundDescription}</p>
                    </div>
                )}
            </div>
            
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-text-base">{config.ui.changeUserStatus}</h2>
                                    <p className="text-sm text-text-muted mt-1">{editingUser.email}</p>
                                </div>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-4 rounded-2xl border border-surface-8 bg-surface-5/30 cursor-pointer hover:bg-surface-5 transition-colors group">
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${editingUser.is_active ? "border-brand-500 bg-brand-500" : "border-surface-20 group-hover:border-surface-30"}`}>
                                        <input
                                            type="radio"
                                            name="user-status"
                                            className="hidden"
                                            checked={editingUser.is_active}
                                            onChange={() => setEditingUser({ ...editingUser, is_active: true })}
                                        />
                                        {editingUser.is_active && <div className="h-2 w-2 rounded-full bg-on-brand" />}
                                    </div>
                                    <span className={`font-medium ${editingUser.is_active ? "text-text-base" : "text-text-muted"}`}>{config.ui.active}</span>
                                </label>

                                <label 
                                    className={`flex items-center gap-3 p-4 rounded-2xl border border-surface-8 transition-colors group ${
                                        currentUser?.id === editingUser.id 
                                            ? "bg-surface-5/10 opacity-50 cursor-not-allowed" 
                                            : "bg-surface-5/30 cursor-pointer hover:bg-surface-5"
                                    }`}
                                >
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${!editingUser.is_active ? "border-brand-500 bg-brand-500" : "border-surface-20 group-hover:border-surface-30"}`}>
                                        <input
                                            type="radio"
                                            name="user-status"
                                            className="hidden"
                                            checked={!editingUser.is_active}
                                            disabled={currentUser?.id === editingUser.id}
                                            onChange={() => setEditingUser({ ...editingUser, is_active: false })}
                                        />
                                        {!editingUser.is_active && <div className="h-2 w-2 rounded-full bg-on-brand" />}
                                    </div>
                                    <span className={`font-medium ${!editingUser.is_active ? "text-text-base" : "text-text-muted"}`}>{config.ui.inactive}</span>
                                </label>

                                {currentUser?.id === editingUser.id && (
                                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium">
                                        ℹ️ {config.ui.cannotInactivateSelf}
                                    </div>
                                )}

                                {!editingUser.is_active && currentUser?.id !== editingUser.id && (
                                    <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                                        ⚠️ {config.ui.inactivateWarning}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 bg-surface-3 p-6 border-t border-surface-8">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-base transition-colors"
                            >
                                {config.ui.cancel}
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(editingUser, editingUser.is_active)}
                                disabled={isUpdating}
                                className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-bold text-on-brand shadow-lg shadow-brand-500/10 hover:bg-brand-600 transition-all disabled:opacity-50"
                            >
                                {isUpdating ? config.ui.saving : config.ui.saveChanges}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {verifyingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-text-base">
                                        {verifyingUser.email_verified_at ? config.ui.unverifyEmailConfirmTitle : config.ui.verifyEmailConfirmTitle}
                                    </h2>
                                    <p className="text-sm text-text-muted mt-1">{verifyingUser.email}</p>
                                </div>
                                <button
                                    onClick={() => setVerifyingUser(null)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            <p className="text-text-base mb-2">
                                {verifyingUser.email_verified_at ? config.ui.unverifyEmailConfirmMessage : config.ui.verifyEmailConfirmMessage}
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 bg-surface-3 p-6 border-t border-surface-8">
                            <button
                                onClick={() => setVerifyingUser(null)}
                                className="px-4 py-2 text-sm font-bold text-text-muted hover:text-text-base transition-colors"
                            >
                                {config.ui.cancel}
                            </button>
                            <button
                                onClick={() => handleVerifyEmail(verifyingUser)}
                                disabled={isUpdating}
                                className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-bold text-on-brand shadow-lg shadow-brand-500/10 hover:bg-brand-600 transition-all disabled:opacity-50"
                            >
                                {isUpdating ? config.ui.saving : (verifyingUser.email_verified_at ? config.ui.unverifyEmail : config.ui.verifyEmail)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
