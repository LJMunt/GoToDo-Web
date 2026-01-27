import { useEffect, useState, useMemo } from "react";
import { listUsers, type User } from "../../api/admin";

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
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterAdmin, setFilterAdmin] = useState<"all" | "admin" | "user">("all");
    const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
    const [sortField, setSortField] = useState<keyof User>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

    const toggleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
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
                <h1 className="text-2xl font-bold text-text-base">User Management</h1>
                <p className="text-sm text-text-muted mt-1">Manage all users in the system.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full bg-surface-3 border border-surface-8 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500 text-text-base placeholder:text-text-muted/50 transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        className="flex-1 md:flex-none bg-surface-3 border border-surface-8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 text-text-base appearance-none cursor-pointer hover:border-surface-20 transition-colors"
                        value={filterAdmin}
                        onChange={(e) => setFilterAdmin(e.target.value as "all" | "admin" | "user")}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="user">Users</option>
                    </select>
                    <select
                        className="flex-1 md:flex-none bg-surface-3 border border-surface-8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 text-text-base appearance-none cursor-pointer hover:border-surface-20 transition-colors"
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-surface-8 bg-surface-3">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                            <tr>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("id")}>
                                    <div className="flex items-center gap-1">
                                        ID
                                        <SortIcon field="id" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("email")}>
                                    <div className="flex items-center gap-1">
                                        Email
                                        <SortIcon field="email" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("is_admin")}>
                                    <div className="flex items-center gap-1">
                                        Role
                                        <SortIcon field="is_admin" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("is_active")}>
                                    <div className="flex items-center gap-1">
                                        Status
                                        <SortIcon field="is_active" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("last_login")}>
                                    <div className="flex items-center gap-1">
                                        Last Login
                                        <SortIcon field="last_login" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("created_at")}>
                                    <div className="flex items-center gap-1">
                                        Creation Date
                                        <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("updated_at")}>
                                    <div className="flex items-center gap-1">
                                        Last Updated
                                        <SortIcon field="updated_at" currentField={sortField} direction={sortDirection} />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-8">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-5/50 transition-colors">
                                    <td className="px-4 py-4 font-mono text-xs text-text-muted">#{user.id}</td>
                                    <td className="px-4 py-4 font-medium text-text-base">{user.email}</td>
                                    <td className="px-4 py-4">
                                        {user.is_admin ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-text-muted border border-surface-20">
                                                User
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        {user.is_active ? (
                                            <span className="flex items-center gap-1.5 text-green-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-text-muted">
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                        {user.last_login ? new Date(user.last_login).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : (
                                            <span className="italic text-text-muted/50">Never logged in</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                        {new Date(user.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                        {new Date(user.updated_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
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
                        <h3 className="text-sm font-medium text-text-base">No users found</h3>
                        <p className="text-xs text-text-muted mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
