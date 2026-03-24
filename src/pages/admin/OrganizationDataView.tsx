import { useParams, NavLink, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { 
    getOrganization, 
    listOrgProjects, 
    listOrgTasks, 
    listOrgTags,
    listOrgMembers,
    type Organization, 
    type Project, 
    type Task, 
    type Tag 
} from "../../api/admin";
import type { components } from "../../api/schema";

type OrgMember = components["schemas"]["OrgMember"];

function SortIcon({ field, currentField, direction }: { field: string, currentField: string, direction: "asc" | "desc" }) {
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

export default function OrganizationDataView() {
    const { orgId, tab } = useParams<{ orgId: string; tab: string }>();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [projects, setProjects] = useState<(Project & { is_deleted?: boolean })[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    
    const [tasks, setTasks] = useState<(Task & { is_deleted?: boolean })[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [taskSortField, setTaskSortField] = useState<keyof Task>("id");
    const [taskSortDirection] = useState<"asc" | "desc">("asc");

    const [tags, setTags] = useState<Tag[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagSortField, setTagSortField] = useState<keyof Tag>("id");
    const [tagSortDirection] = useState<"asc" | "desc">("asc");

    const [members, setMembers] = useState<OrgMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberSortField, setMemberSortField] = useState<keyof OrgMember>("public_id");
    const [memberSortDirection] = useState<"asc" | "desc">("asc");

    const [showDeleted, setShowDeleted] = useState(false);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof Project>("id");
    const [sortDirection] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        const fetchOrg = async () => {
            if (!orgId) return;
            const id = parseInt(orgId);
            if (isNaN(id)) return;

            try {
                const data = await getOrganization(id);
                setOrg(data);
            } catch (e) {
                console.error("Failed to fetch organization:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, [orgId]);

    useEffect(() => {
        if (tab === "projects" && orgId) {
            const fetchProjects = async () => {
                const id = parseInt(orgId);
                if (isNaN(id)) return;

                setProjectsLoading(true);
                try {
                    let projectsData: (Project & { is_deleted?: boolean })[] = [];
                    if (showDeleted) {
                        const [allProjects, activeProjects] = await Promise.all([
                            listOrgProjects(id, true),
                            listOrgProjects(id, false)
                        ]);
                        const activeIds = new Set(activeProjects.map(p => p.id));
                        projectsData = allProjects.map(p => ({
                            ...p,
                            is_deleted: !activeIds.has(p.id)
                        }));
                    } else {
                        const activeProjects = await listOrgProjects(id, false);
                        projectsData = activeProjects.map(p => ({
                            ...p,
                            is_deleted: false
                        }));
                    }
                    setProjects(projectsData);
                } catch (e) {
                    console.error("Failed to fetch projects:", e);
                } finally {
                    setProjectsLoading(false);
                }
            };
            fetchProjects();
        }
    }, [tab, orgId, showDeleted]);

    useEffect(() => {
        if (tab === "tasks" && orgId) {
            const fetchTasks = async () => {
                const id = parseInt(orgId);
                if (isNaN(id)) return;

                setTasksLoading(true);
                try {
                    let tasksData: (Task & { is_deleted?: boolean })[] = [];
                    if (showDeleted) {
                        const [allTasks, activeTasks] = await Promise.all([
                            listOrgTasks(id, true),
                            listOrgTasks(id, false)
                        ]);
                        const activeIds = new Set(activeTasks.map(t => t.id));
                        tasksData = allTasks.map(t => ({
                            ...t,
                            is_deleted: !activeIds.has(t.id)
                        }));
                    } else {
                        const activeTasks = await listOrgTasks(id, false);
                        tasksData = activeTasks.map(t => ({
                            ...t,
                            is_deleted: false
                        }));
                    }
                    setTasks(tasksData);
                } catch (e) {
                    console.error("Failed to fetch tasks:", e);
                } finally {
                    setTasksLoading(false);
                }
            };
            fetchTasks();
        }
    }, [tab, orgId, showDeleted]);

    useEffect(() => {
        if (tab === "tags" && orgId) {
            const fetchTags = async () => {
                const id = parseInt(orgId);
                if (isNaN(id)) return;

                setTagsLoading(true);
                try {
                    const data = await listOrgTags(id);
                    setTags(data);
                } catch (e) {
                    console.error("Failed to fetch tags:", e);
                } finally {
                    setTagsLoading(false);
                }
            };
            fetchTags();
        }
    }, [tab, orgId]);

    useEffect(() => {
        if (tab === "members" && orgId) {
            const fetchMembers = async () => {
                const id = parseInt(orgId);
                if (isNaN(id)) return;

                setMembersLoading(true);
                try {
                    const data = await listOrgMembers(id);
                    setMembers(data);
                } catch (e) {
                    console.error("Failed to fetch members:", e);
                } finally {
                    setMembersLoading(false);
                }
            };
            fetchMembers();
        }
    }, [tab, orgId]);

    const tabs = [
        {
            id: "projects",
            label: "Projects",
            path: `/admin/organizations/${orgId}/projects`,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
            )
        },
        {
            id: "tasks",
            label: "Tasks",
            path: `/admin/organizations/${orgId}/tasks`,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        {
            id: "tags",
            label: "Tags",
            path: `/admin/organizations/${orgId}/tags`,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            )
        },
        {
            id: "members",
            label: "Members",
            path: `/admin/organizations/${orgId}/members`,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
    ];

    const filteredProjects = useMemo(() => {
        const filtered = projects.filter(project => {
            const matchesSearch = 
                project.name.toLowerCase().includes(search.toLowerCase()) || 
                (project.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
                project.id.toString().includes(search);
            return matchesSearch;
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
    }, [projects, search, sortField, sortDirection]);

    const filteredTasks = useMemo(() => {
        const filtered = tasks.filter(task => {
            const matchesSearch = 
                task.title.toLowerCase().includes(search.toLowerCase()) || 
                (task.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
                task.id.toString().includes(search);
            return matchesSearch;
        });

        return [...filtered].sort((a, b) => {
            const valA = a[taskSortField];
            const valB = b[taskSortField];

            if (valA === null || valA === undefined) return taskSortDirection === "asc" ? -1 : 1;
            if (valB === null || valB === undefined) return taskSortDirection === "asc" ? 1 : -1;

            if (valA < valB) return taskSortDirection === "asc" ? -1 : 1;
            if (valA > valB) return taskSortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [tasks, search, taskSortField, taskSortDirection]);

    const filteredTags = useMemo(() => {
        const filtered = tags.filter(tag => {
            const matchesSearch = 
                tag.name.toLowerCase().includes(search.toLowerCase()) || 
                tag.id.toString().includes(search);
            return matchesSearch;
        });

        return [...filtered].sort((a, b) => {
            const valA = a[tagSortField];
            const valB = b[tagSortField];

            if (valA === null || valA === undefined) return tagSortDirection === "asc" ? -1 : 1;
            if (valB === null || valB === undefined) return tagSortDirection === "asc" ? 1 : -1;

            if (valA < valB) return tagSortDirection === "asc" ? -1 : 1;
            if (valA > valB) return tagSortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [tags, search, tagSortField, tagSortDirection]);

    const filteredMembers = useMemo(() => {
        const filtered = members.filter(member => {
            const matchesSearch = 
                member.email.toLowerCase().includes(search.toLowerCase()) || 
                member.public_id.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });

        return [...filtered].sort((a, b) => {
            const valA = a[memberSortField];
            const valB = b[memberSortField];

            if (valA === null || valA === undefined) return memberSortDirection === "asc" ? -1 : 1;
            if (valB === null || valB === undefined) return memberSortDirection === "asc" ? 1 : -1;

            if (valA < valB) return memberSortDirection === "asc" ? -1 : 1;
            if (valA > valB) return memberSortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [members, search, memberSortField, memberSortDirection]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link 
                    to="/admin/organizations"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-text-base transition-none!">Organization Data <span className="text-text-muted font-normal ml-2">{org?.name || (loading ? "..." : `#${orgId}`)}</span></h1>
            </div>

            <div className="bg-surface-2 rounded-2xl border border-surface-8 overflow-hidden">
                <div className="border-b border-surface-8 bg-surface-5/30 px-6">
                    <nav className="flex gap-8">
                        {tabs.map((t) => (
                            <NavLink
                                key={t.id}
                                to={t.path}
                                className={({ isActive }) =>
                                    `py-4 text-sm font-medium transition-all relative flex items-center gap-2 group ${
                                        isActive
                                            ? "text-brand-500"
                                            : "text-text-muted hover:text-text-base"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {t.icon}
                                        </span>
                                        {t.label}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full shadow-[0_0_8px_rgba(var(--brand-500-rgb),0.5)]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {tab === "projects" && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-80">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        className="w-full bg-surface-3 border border-surface-8 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500 text-text-base placeholder:text-text-muted/50 transition-colors"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showDeleted ? 'bg-brand-500 border-brand-500' : 'bg-surface-5 border-surface-20 group-hover:border-surface-30'}`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={showDeleted}
                                                onChange={(e) => setShowDeleted(e.target.checked)}
                                            />
                                            {showDeleted && (
                                                <svg className="w-3 h-3 text-on-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-text-muted group-hover:text-text-base transition-colors">Show deleted projects</span>
                                    </label>
                                    {projectsLoading && <div className="text-xs text-text-muted animate-pulse">Loading data...</div>}
                                </div>
                            </div>
                            
                            <div className="overflow-hidden rounded-xl border border-surface-8 bg-surface-3">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                            <tr>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setSortField("id")}>
                                                    <div className="flex items-center gap-1">
                                                        ID
                                                        <SortIcon field="id" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setSortField("name")}>
                                                    <div className="flex items-center gap-1">
                                                        Name
                                                        <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setSortField("description")}>
                                                    <div className="flex items-center gap-1">
                                                        Description
                                                        <SortIcon field="description" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setSortField("created_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Created At
                                                        <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {filteredProjects.length === 0 && !projectsLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic">
                                                        {search ? "No projects found matching your search." : "No projects found for this organization."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredProjects.map((project) => (
                                                    <tr key={project.id} className={`transition-colors group ${project.is_deleted ? 'opacity-60 bg-surface-5/30' : 'hover:bg-surface-5/50'}`}>
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">#{project.id}</td>
                                                        <td className="px-4 py-4 font-medium text-text-base">{project.name}</td>
                                                        <td className="px-4 py-4 text-text-muted truncate max-w-xs">{project.description || "—"}</td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(project.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {project.is_deleted && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                                                                        Deleted
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "tasks" && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-80">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        className="w-full bg-surface-3 border border-surface-8 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500 text-text-base placeholder:text-text-muted/50 transition-colors"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showDeleted ? 'bg-brand-500 border-brand-500' : 'bg-surface-5 border-surface-20 group-hover:border-surface-30'}`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={showDeleted}
                                                onChange={(e) => setShowDeleted(e.target.checked)}
                                            />
                                            {showDeleted && (
                                                <svg className="w-3 h-3 text-on-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-text-muted group-hover:text-text-base transition-colors">Show deleted tasks</span>
                                    </label>
                                    {tasksLoading && <div className="text-xs text-text-muted animate-pulse">Loading data...</div>}
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-surface-8 bg-surface-3">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                            <tr>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setTaskSortField("id")}>
                                                    <div className="flex items-center gap-1">
                                                        ID
                                                        <SortIcon field="id" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setTaskSortField("title")}>
                                                    <div className="flex items-center gap-1">
                                                        Title
                                                        <SortIcon field="title" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setTaskSortField("completed_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Status
                                                        <SortIcon field="completed_at" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setTaskSortField("created_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Created At
                                                        <SortIcon field="created_at" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {filteredTasks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                                                        {tasksLoading ? "Loading tasks..." : "No tasks found."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTasks.map((task) => (
                                                    <tr key={task.id} className={`group hover:bg-surface-5/50 transition-colors ${task.is_deleted ? 'opacity-60 bg-surface-10/20' : ''}`}>
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">#{task.id}</td>
                                                        <td className="px-4 py-4 font-medium text-text-base">{task.title}</td>
                                                        <td className="px-4 py-4">
                                                            {task.completed_at ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                                                                    Completed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-10 text-text-muted text-xs font-medium border border-surface-20">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(task.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {task.is_deleted && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                                                                    Deleted
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "tags" && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-80">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search tags..."
                                        className="w-full bg-surface-3 border border-surface-8 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500 text-text-base placeholder:text-text-muted/50 transition-colors"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    {tagsLoading && <div className="text-xs text-text-muted animate-pulse">Loading tags...</div>}
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-surface-8 bg-surface-3">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                            <tr>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setTagSortField("id")}>
                                                    <div className="flex items-center gap-1">
                                                        ID
                                                        <SortIcon field="id" currentField={tagSortField} direction={tagSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setTagSortField("name")}>
                                                    <div className="flex items-center gap-1">
                                                        Name
                                                        <SortIcon field="name" currentField={tagSortField} direction={tagSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setTagSortField("created_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Created At
                                                        <SortIcon field="created_at" currentField={tagSortField} direction={tagSortDirection} />
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {filteredTags.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                                                        {tagsLoading ? "Loading tags..." : "No tags found."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTags.map((tag) => (
                                                    <tr key={tag.id} className="group hover:bg-surface-5/50 transition-colors">
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">#{tag.id}</td>
                                                        <td className="px-4 py-4 font-medium text-text-base">{tag.name}</td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(tag.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "members" && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-80">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        className="w-full bg-surface-3 border border-surface-8 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500 text-text-base placeholder:text-text-muted/50 transition-colors"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    {membersLoading && <div className="text-xs text-text-muted animate-pulse">Loading members...</div>}
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-surface-8 bg-surface-3">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-surface-5 text-text-muted font-medium border-b border-surface-8">
                                            <tr>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setMemberSortField("public_id")}>
                                                    <div className="flex items-center gap-1">
                                                        Public ID
                                                        <SortIcon field="public_id" currentField={memberSortField} direction={memberSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setMemberSortField("email")}>
                                                    <div className="flex items-center gap-1">
                                                        Email
                                                        <SortIcon field="email" currentField={memberSortField} direction={memberSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setMemberSortField("role")}>
                                                    <div className="flex items-center gap-1">
                                                        Role
                                                        <SortIcon field="role" currentField={memberSortField} direction={memberSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => setMemberSortField("joined_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Joined At
                                                        <SortIcon field="joined_at" currentField={memberSortField} direction={memberSortDirection} />
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {filteredMembers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                                                        {membersLoading ? "Loading members..." : "No members found."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMembers.map((member) => (
                                                    <tr key={member.public_id} className="group hover:bg-surface-5/50 transition-colors">
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">{member.public_id}</td>
                                                        <td className="px-4 py-4 font-medium text-text-base">{member.email}</td>
                                                        <td className="px-4 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                                member.role === 'admin' 
                                                                    ? 'bg-brand-500/10 text-brand-500 border-brand-500/20' 
                                                                    : 'bg-surface-10 text-text-muted border-surface-20'
                                                            }`}>
                                                                {member.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(member.joined_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
