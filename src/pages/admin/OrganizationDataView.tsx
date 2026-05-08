import { useParams, NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
    getOrganization, 
    listOrganizationProjects, 
    listOrganizationTasks, 
    listOrganizationTags, 
    listOrganizationMembers,
    type Organization, 
    type Project, 
    type Task, 
    type Tag,
    type OrgMember
} from "../../api/admin";
import { useConfig } from "../../features/config/ConfigContext";


export default function OrganizationDataView() {
    const { orgId, tab } = useParams<{ orgId: string; tab: string }>();
    const { config } = useConfig();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);

    const [tags, setTags] = useState<Tag[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);

    const [members, setMembers] = useState<OrgMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    const [showDeleted, setShowDeleted] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchOrg = async () => {
            if (!orgId) return;
            const id = parseInt(orgId);
            if (isNaN(id)) return;

            try {
                const data = await getOrganization(id);
                setOrg(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch organization");
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, [orgId]);

    useEffect(() => {
        if (!orgId) return;
        const id = parseInt(orgId);
        if (isNaN(id)) return;

        if (tab === "projects") {
            setProjectsLoading(true);
            listOrganizationProjects(id, showDeleted).then(setProjects).finally(() => setProjectsLoading(false));
        } else if (tab === "tasks") {
            setTasksLoading(true);
            listOrganizationTasks(id, showDeleted).then(setTasks).finally(() => setTasksLoading(false));
        } else if (tab === "tags") {
            setTagsLoading(true);
            listOrganizationTags(id).then(setTags).finally(() => setTagsLoading(false));
        } else if (tab === "members") {
            setMembersLoading(true);
            listOrganizationMembers(id).then(setMembers).finally(() => setMembersLoading(false));
        }
    }, [orgId, tab, showDeleted]);

    if (loading) {
        return <div className="p-8 text-center text-text-muted">{config.ui.loading}</div>;
    }

    if (error || !org) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error || "Organization not found"}</p>
                <Link to="/admin/orgs" className="text-brand-500 hover:underline">Back to Organizations</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/orgs" className="p-2 hover:bg-surface-8 rounded-xl transition-colors text-text-muted hover:text-text-base">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-base">{org.name}</h1>
                    <p className="text-sm text-text-muted">Workspace: {org.workspace_id}</p>
                </div>
            </div>

            <div className="flex border-b border-surface-8">
                {[
                    { id: "members", label: "Members" },
                    { id: "projects", label: "Projects" },
                    { id: "tasks", label: "Tasks" },
                    { id: "tags", label: "Tags" },
                ].map((t) => (
                    <NavLink
                        key={t.id}
                        to={`/admin/orgs/${orgId}/${t.id}`}
                        className={({ isActive }) => `px-6 py-4 text-sm font-bold transition-all border-b-2 ${isActive ? "border-brand-500 text-brand-500" : "border-transparent text-text-muted hover:text-text-base"}`}
                    >
                        {t.label}
                    </NavLink>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-surface-3 border border-surface-8 rounded-xl pl-11 pr-4 py-2 text-sm text-text-base focus:outline-none focus:border-brand-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {(tab === "projects" || tab === "tasks") && (
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-surface-8 bg-surface-5 text-brand-500 focus:ring-brand-500/20"
                            checked={showDeleted}
                            onChange={(e) => setShowDeleted(e.target.checked)}
                        />
                        <span className="text-sm text-text-base">Show deleted</span>
                    </label>
                )}
            </div>

            <div className="bg-surface-3 border border-surface-8 rounded-xl overflow-hidden text-sm">
                {tab === "members" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                <tr>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Public ID</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Email</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Role</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Joined At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-8">
                                {membersLoading ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">Loading members...</td></tr>
                                ) : members.length === 0 ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No members found.</td></tr>
                                ) : members.map((member) => (
                                    <tr key={member.public_id} className="hover:bg-surface-5/50 transition-colors">
                                        <td className="px-4 py-4 font-mono text-xs">{member.public_id}</td>
                                        <td className="px-4 py-4">
                                            {member.email}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase tracking-wider border border-brand-500/20">
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-text-muted">{new Date(member.joined_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === "projects" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                <tr>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">ID</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Name</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-8">
                                {projectsLoading ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-text-muted">Loading projects...</td></tr>
                                ) : projects.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-text-muted">No projects found.</td></tr>
                                ) : projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((project) => (
                                    <tr key={project.id} className="hover:bg-surface-5/50 transition-colors">
                                        <td className="px-4 py-4 font-mono text-xs">#{project.id}</td>
                                        <td className="px-4 py-4 font-medium">{project.name}</td>
                                        <td className="px-4 py-4 text-text-muted max-w-xs truncate">{project.description || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === "tasks" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                <tr>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">ID</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Title</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Status</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-8">
                                {tasksLoading ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">Loading tasks...</td></tr>
                                ) : tasks.length === 0 ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No tasks found.</td></tr>
                                ) : tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())).map((task) => (
                                    <tr key={task.id} className="hover:bg-surface-5/50 transition-colors">
                                        <td className="px-4 py-4 font-mono text-xs">#{task.id}</td>
                                        <td className="px-4 py-4 font-medium">{task.title}</td>
                                        <td className="px-4 py-4">
                                            {task.deleted_at ? (
                                                <span className="text-red-500 font-bold uppercase text-[10px]">Deleted</span>
                                            ) : task.completed_at ? (
                                                <span className="text-brand-500 font-bold uppercase text-[10px]">Completed</span>
                                            ) : (
                                                <span className="text-text-muted font-bold uppercase text-[10px]">Open</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-text-muted">
                                            {task.due_at ? new Date(task.due_at).toLocaleDateString() : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === "tags" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                <tr>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">ID</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Name</th>
                                    <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Color</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-8">
                                {tagsLoading ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-text-muted">Loading tags...</td></tr>
                                ) : tags.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-text-muted">No tags found.</td></tr>
                                ) : tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map((tag) => (
                                    <tr key={tag.id} className="hover:bg-surface-5/50 transition-colors">
                                        <td className="px-4 py-4 font-mono text-xs">#{tag.id}</td>
                                        <td className="px-4 py-4 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#888' }}></div>
                                                {tag.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">{tag.color || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
