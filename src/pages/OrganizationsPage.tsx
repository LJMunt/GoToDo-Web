import { useState, useEffect } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { 
    getOrgs, 
    getOrgMembers, 
    updateOrg, 
    addOrgMember, 
    removeOrgMember, 
    leaveOrg, 
    deleteOrg,
    type Organization,
    type OrgMember
} from "../api/orgs";
import { searchUsers, type UserSearchResult } from "../api/users";
import { OrganizationCreateModal } from "../components/OrganizationCreateModal";

export default function OrganizationsPage() {
    const { state, refresh } = useAuth();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    
    const [newName, setNewName] = useState("");
    const [updating, setUpdating] = useState(false);
    
    const user = state.status === "authenticated" ? state.user : null;

    useEffect(() => {
        async function fetchOrgs() {
            setLoading(true);
            try {
                const data = await getOrgs();
                setOrgs(data);
                if (data.length > 0 && !selectedOrgId) {
                    setSelectedOrgId(data[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchOrgs();
    }, [selectedOrgId]);

    useEffect(() => {
        async function fetchMembers(id: number) {
            setLoadingMembers(true);
            try {
                const data = await getOrgMembers(id);
                setMembers(data);
            } catch (err) {
                console.error("Failed to fetch members:", err);
            } finally {
                setLoadingMembers(false);
            }
        }

        if (selectedOrgId) {
            fetchMembers(selectedOrgId);
            const org = orgs.find(o => o.id === selectedOrgId);
            if (org) {
                setNewName(org.name);
            }
        }
    }, [selectedOrgId, orgs]);

    const selectedOrg = orgs.find(o => o.id === selectedOrgId);
    const myMemberInfo = members.find(m => m.public_id === user?.public_id);
    const isAdmin = myMemberInfo?.role === "admin";

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (inviteEmail.length >= 2 && !selectedUser && isAdmin) {
                setSearching(true);
                try {
                    const results = await searchUsers(inviteEmail);
                    setSearchResults(results);
                    
                    // Auto-select if exact match found
                    const exactMatch = results.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase());
                    if (exactMatch) {
                        setSelectedUser(exactMatch);
                        setSearchResults([]);
                    }
                } catch (err) {
                    console.error("Search failed:", err);
                } finally {
                    setSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inviteEmail, selectedUser, isAdmin]);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedOrgId || !selectedUser) return;
        
        setInviting(true);
        setInviteError(null);
        try {
            await addOrgMember(selectedOrgId, selectedUser.public_id);
            setInviteEmail("");
            setSelectedUser(null);
            const data = await getOrgMembers(selectedOrgId);
            setMembers(data);
        } catch (err) {
            setInviteError(err instanceof Error ? err.message : "Failed to add user");
        } finally {
            setInviting(false);
        }
    }

    async function handleRemoveMember(memberPublicId: string) {
        if (!selectedOrgId) return;
        if (!confirm("Are you sure you want to remove this member?")) return;
        
        try {
            await removeOrgMember(selectedOrgId, memberPublicId);
            const data = await getOrgMembers(selectedOrgId);
            setMembers(data);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to remove member");
        }
    }

    async function handleRename() {
        if (!selectedOrgId || !newName.trim()) return;
        setUpdating(true);
        try {
            await updateOrg(selectedOrgId, newName.trim());
            setOrgs(orgs.map(o => o.id === selectedOrgId ? { ...o, name: newName } : o));
            await refresh(); // Refresh user profile to get updated workspace names
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to rename organization");
        } finally {
            setUpdating(false);
        }
    }

    async function handleLeave() {
        if (!selectedOrgId) return;
        if (!confirm("Are you sure you want to leave this organization?")) return;
        
        try {
            await leaveOrg(selectedOrgId);
            const remainingOrgs = orgs.filter(o => o.id !== selectedOrgId);
            setOrgs(remainingOrgs);
            if (remainingOrgs.length > 0) {
                setSelectedOrgId(remainingOrgs[0].id);
            } else {
                setSelectedOrgId(null);
            }
            await refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to leave organization");
        }
    }

    async function handleDelete() {
        if (!selectedOrgId) return;
        if (!confirm("Are you sure you want to delete this organization? This will soft-delete it and all its content.")) return;
        
        try {
            await deleteOrg(selectedOrgId);
            const remainingOrgs = orgs.filter(o => o.id !== selectedOrgId);
            setOrgs(remainingOrgs);
            if (remainingOrgs.length > 0) {
                setSelectedOrgId(remainingOrgs[0].id);
            } else {
                setSelectedOrgId(null);
            }
            await refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete organization");
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-base">Organizations</h1>
                    <p className="text-text-muted mt-2">Manage your team workspaces and collaborations.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-brand-500 hover:bg-brand-600 text-on-brand px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12M6 12h12" />
                    </svg>
                    New Organization
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar: Org List */}
                <div className="lg:col-span-4 space-y-3">
                    {orgs.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-surface-10 rounded-3xl text-center">
                            <p className="text-text-muted text-sm">You are not a member of any organization yet.</p>
                        </div>
                    ) : (
                        orgs.map(org => (
                            <button
                                key={org.id}
                                onClick={() => setSelectedOrgId(org.id)}
                                className={`w-full text-left p-5 rounded-3xl transition-all border ${
                                    selectedOrgId === org.id
                                        ? "bg-surface-5 border-brand-500/50 shadow-lg shadow-brand-500/5"
                                        : "bg-surface-3 border-surface-10 hover:border-surface-20"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-text-base truncate">{org.name}</span>
                                    {org.deleted_at && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                                            Deleted
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-text-muted mt-1 font-mono uppercase tracking-tighter opacity-50">
                                    {org.workspace_id}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Content: Org Details */}
                <div className="lg:col-span-8">
                    {selectedOrg ? (
                        <div className="bg-surface-3 border border-surface-10 rounded-4xl overflow-hidden">
                            <div className="p-8 border-b border-surface-10 bg-surface-5/30">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1 min-w-0">
                                        {isAdmin ? (
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="text"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className="text-2xl font-bold bg-transparent border-b-2 border-transparent focus:border-brand-500 outline-none text-text-base w-full transition-all"
                                                />
                                                <button
                                                    onClick={handleRename}
                                                    disabled={updating || newName === selectedOrg.name}
                                                    className="text-xs font-bold uppercase tracking-widest text-brand-500 hover:text-brand-600 disabled:opacity-0 transition-all whitespace-nowrap"
                                                >
                                                    {updating ? "Saving..." : "Save Name"}
                                                </button>
                                            </div>
                                        ) : (
                                            <h2 className="text-2xl font-bold text-text-base truncate">{selectedOrg.name}</h2>
                                        )}
                                        <p className="text-xs text-text-muted mt-1 font-mono">{selectedOrg.workspace_id}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleLeave}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold border border-surface-20 hover:bg-surface-10 text-text-base transition-all"
                                        >
                                            Leave
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={handleDelete}
                                                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="mb-10">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-6 flex items-center gap-2">
                                        <span className="w-8 h-px bg-surface-20"></span>
                                        Add Member
                                    </h3>
                                    <div className="relative">
                                        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={inviteEmail}
                                                    onChange={(e) => {
                                                        setInviteEmail(e.target.value);
                                                        setSelectedUser(null);
                                                    }}
                                                    placeholder="Search user by email..."
                                                    className="w-full bg-surface-5 border border-surface-10 rounded-2xl px-5 py-3.5 text-sm text-text-base focus:outline-none focus:border-brand-500/50 transition-all"
                                                    required
                                                />
                                                {searching && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                                                    </div>
                                                )}
                                                {inviteError && (
                                                    <p className="absolute -bottom-6 left-1 text-[10px] font-bold text-red-500">{inviteError}</p>
                                                )}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={inviting || !isAdmin || !selectedUser}
                                                className="bg-brand-500 hover:bg-brand-600 text-on-brand px-8 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                                            >
                                                {inviting ? "Adding..." : "Add"}
                                            </button>
                                        </form>

                                        {searchResults.length > 0 && !selectedUser && (
                                            <div className="absolute z-10 w-full mt-2 bg-surface-3 border border-surface-10 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                                {searchResults.map(u => (
                                                    <button
                                                        key={u.public_id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setInviteEmail(u.email);
                                                            setSearchResults([]);
                                                        }}
                                                        className="w-full text-left px-5 py-3 hover:bg-surface-10 text-sm text-text-base border-b border-surface-10 last:border-0"
                                                    >
                                                        {u.email}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {inviteEmail.length >= 2 && !searching && searchResults.length === 0 && !selectedUser && !inviteError && (
                                            <div className="absolute z-10 w-full mt-2 bg-surface-3 border border-surface-10 rounded-2xl shadow-xl p-4 text-center">
                                                <p className="text-sm text-text-muted text-sm">No user found with this email.</p>
                                            </div>
                                        )}
                                    </div>
                                    {!isAdmin && (
                                        <p className="text-[10px] text-text-muted mt-3 italic ml-1">Only administrators can add new members.</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-6 flex items-center gap-2">
                                        <span className="w-8 h-px bg-surface-20"></span>
                                        Members ({members.length})
                                    </h3>
                                    <div className="space-y-4">
                                        {loadingMembers ? (
                                            <div className="py-8 flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                                            </div>
                                        ) : (
                                            members.map(member => (
                                                <div key={member.public_id} className="flex items-center justify-between p-4 bg-surface-5/50 rounded-2xl border border-surface-10">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold shrink-0">
                                                            {member.email[0].toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-text-base truncate">
                                                                {member.email}
                                                                {member.public_id === user?.public_id && (
                                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-brand-500/70">(You)</span>
                                                                )}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-text-muted mt-0.5">{member.public_id}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                                                            member.role === 'admin' ? 'bg-brand-500/10 text-brand-500' :
                                                            'bg-surface-20 text-text-muted'
                                                        }`}>
                                                            {member.role}
                                                        </span>
                                                        {isAdmin && member.public_id !== user?.public_id && (
                                                            <button
                                                                onClick={() => handleRemoveMember(member.public_id)}
                                                                className="p-2 text-text-muted hover:text-red-500 transition-colors"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-surface-3 border border-surface-10 border-dashed rounded-4xl">
                            <div className="w-20 h-20 rounded-full bg-surface-5 flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-text-base">Select an Organization</h2>
                            <p className="text-text-muted max-w-xs mt-2">Choose an organization from the list to view its members and settings.</p>
                        </div>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <OrganizationCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={async () => {
                        const data = await getOrgs();
                        setOrgs(data);
                        await refresh();
                    }}
                />
            )}
        </div>
    );
}
