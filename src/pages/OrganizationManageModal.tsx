import { useState, useEffect, FormEvent } from "react";
import { useConfig } from "../features/config/ConfigContext";
import { useAuth } from "../features/auth/AuthContext";
import { 
    updateOrganization, 
    deleteOrganization, 
    leaveOrganization, 
    listOrgMembers, 
    addOrUpdateOrgMember, 
    removeOrgMember 
} from "../api/orgs";
import { searchUsers } from "../api/users";
import type { components } from "../api/schema";

type Organization = components["schemas"]["Organization"];
type OrgMember = components["schemas"]["OrgMember"];

interface Props {
    organization: Organization;
    onClose: () => void;
    onUpdated: () => void;
}

export function OrganizationManageModal({ organization, onClose, onUpdated }: Props) {
    const { config } = useConfig();
    const { state, refresh } = useAuth();
    const user = state.status === "authenticated" ? state.user : null;
    
    const [name, setName] = useState(organization.name);
    const [updating, setUpdating] = useState(false);
    
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    
    const [emailSearch, setEmailSearch] = useState("");
    const [searchingUser, setSearchingUser] = useState(false);
    const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
    const [inviteError, setInviteError] = useState<string | null>(null);

    const myMember = members.find(m => m.user_id === user?.public_id);
    const isAdmin = myMember?.role === "admin";

    useEffect(() => {
        loadMembers();
    }, [organization.id]);

    async function loadMembers() {
        try {
            const data = await listOrgMembers(organization.id);
            setMembers(data ?? []);
        } catch (err) {
            console.error("Failed to load members", err);
        } finally {
            setLoadingMembers(false);
        }
    }

    async function handleUpdateName(e: FormEvent) {
        e.preventDefault();
        if (!name.trim() || name === organization.name) return;
        setUpdating(true);
        try {
            await updateOrganization(organization.id, name.trim());
            onUpdated();
        } catch (err) {
            console.error("Failed to update organization", err);
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete ${organization.name}? This action is irreversible.`)) return;
        try {
            await deleteOrganization(organization.id);
            await refresh();
            onUpdated();
            onClose();
        } catch (err) {
            console.error("Failed to delete organization", err);
        }
    }

    async function handleLeave() {
        if (!confirm(`Are you sure you want to leave ${organization.name}?`)) return;
        try {
            await leaveOrganization(organization.id);
            await refresh();
            onUpdated();
            onClose();
        } catch (err) {
            console.error("Failed to leave organization", err);
            alert(err instanceof Error ? err.message : "Failed to leave organization");
        }
    }

    async function handleInvite(e: FormEvent) {
        e.preventDefault();
        if (!emailSearch.trim()) return;
        setSearchingUser(true);
        setInviteError(null);
        try {
            const users = await searchUsers(emailSearch.trim());
            const targetUser = users.find(u => u.email.toLowerCase() === emailSearch.trim().toLowerCase());
            if (!targetUser) {
                setInviteError("User not found");
                return;
            }
            await addOrUpdateOrgMember(organization.id, targetUser.public_id, inviteRole);
            setEmailSearch("");
            loadMembers();
        } catch (err) {
            console.error("Failed to invite user", err);
            setInviteError(err instanceof Error ? err.message : "Failed to invite user");
        } finally {
            setSearchingUser(false);
        }
    }

    async function handleRemoveMember(member: OrgMember) {
        if (!confirm(`Remove ${member.email} from the organization?`)) return;
        try {
            await removeOrgMember(organization.id, member.user_id);
            loadMembers();
        } catch (err) {
            console.error("Failed to remove member", err);
        }
    }

    async function handleChangeRole(member: OrgMember, newRole: string) {
        try {
            await addOrUpdateOrgMember(organization.id, member.user_id, newRole);
            loadMembers();
        } catch (err) {
            console.error("Failed to change role", err);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-2xl overflow-hidden rounded-3xl border border-surface-10 bg-bg-base shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-surface-10 px-8 py-6">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-text-base">
                            Manage Organization
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-1">
                            {organization.workspace_id}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-text-muted transition hover:bg-surface-5 hover:text-text-base cursor-pointer"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto p-8 space-y-10">
                    {/* General Settings */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-500">General</h3>
                        <form onSubmit={handleUpdateName} className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!isAdmin}
                                    className="w-full rounded-xl border border-surface-10 bg-surface-3 px-4 py-3 text-sm transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none disabled:opacity-50"
                                    placeholder="Organization Name"
                                />
                            </div>
                            {isAdmin && (
                                <button
                                    type="submit"
                                    disabled={updating || name === organization.name || !name.trim()}
                                    className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-bold text-on-brand transition hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
                                >
                                    {updating ? "Saving..." : "Rename"}
                                </button>
                            )}
                        </form>
                    </section>

                    {/* Members */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-500">Members</h3>
                            <span className="rounded-full bg-surface-8 px-2 py-0.5 text-[10px] font-bold text-text-muted">
                                {members.length}
                            </span>
                        </div>

                        {isAdmin && (
                            <form onSubmit={handleInvite} className="space-y-3 rounded-2xl border border-dashed border-surface-15 p-4">
                                <div className="flex gap-3">
                                    <input
                                        value={emailSearch}
                                        onChange={(e) => setEmailSearch(e.target.value)}
                                        placeholder="Invite by email..."
                                        className="flex-1 rounded-xl border border-surface-10 bg-surface-3 px-4 py-2 text-sm outline-none focus:border-brand-500"
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as any)}
                                        className="rounded-xl border border-surface-10 bg-surface-3 px-3 py-2 text-sm outline-none"
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={searchingUser || !emailSearch.trim()}
                                        className="rounded-xl bg-surface-10 px-4 py-2 text-sm font-bold text-text-base transition hover:bg-surface-15 disabled:opacity-50 cursor-pointer"
                                    >
                                        {searchingUser ? "..." : "Add"}
                                    </button>
                                </div>
                                {inviteError && <p className="text-xs font-bold text-red-500">{inviteError}</p>}
                            </form>
                        )}

                        <div className="space-y-2">
                            {loadingMembers ? (
                                <div className="py-4 text-center text-sm text-text-muted animate-pulse">Loading members...</div>
                            ) : (
                                members.map(member => (
                                    <div key={member.user_id} className="flex items-center justify-between rounded-2xl border border-surface-5 bg-surface-3 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-surface-10 flex items-center justify-center text-[10px] font-bold text-text-muted uppercase">
                                                {member.email.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-base">{member.email}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                                    Joined {new Date(member.joined_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isAdmin && member.user_id !== user?.public_id ? (
                                                <>
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleChangeRole(member, e.target.value)}
                                                        className="rounded-lg border border-surface-10 bg-surface-5 px-2 py-1 text-[10px] font-bold uppercase outline-none"
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleRemoveMember(member)}
                                                        className="rounded-lg p-1.5 text-text-muted transition hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                                                        title="Remove member"
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="rounded-lg bg-surface-10 px-2 py-1 text-[10px] font-bold uppercase text-text-muted">
                                                    {member.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-6 border-t border-surface-10 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Danger Zone</h3>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleLeave}
                                className="flex items-center gap-2 rounded-xl border border-surface-10 px-6 py-3 text-sm font-bold text-text-base transition hover:bg-surface-5 active:scale-95 cursor-pointer"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                Leave Organization
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-6 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500/20 active:scale-95 cursor-pointer"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    Delete Organization
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
