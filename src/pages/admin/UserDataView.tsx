import { useParams, NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, listUserProjects, listUserProjectTasks, updateUserProject, deleteUserProject, restoreUserProject, type User, type Project } from "../../api/admin";

export default function UserDataView() {
    const { userId, tab } = useParams<{ userId: string; tab: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<(Project & { is_deleted?: boolean })[]>([]);
    const [taskCounts, setTaskCounts] = useState<Record<number, number>>({});
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);

    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [editingField, setEditingField] = useState<"name" | "description" | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [isUpdatingProject, setIsUpdatingProject] = useState(false);
    const [isDeletingProjectId, setIsDeletingProjectId] = useState<number | null>(null);
    const [isRestoringProjectId, setIsRestoringProjectId] = useState<number | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            const id = parseInt(userId);
            if (isNaN(id)) return;

            try {
                const data = await getUser(id);
                setUser(data);
            } catch (e) {
                console.error("Failed to fetch user:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    useEffect(() => {
        if (tab === "projects" && userId) {
            const fetchProjects = async () => {
                const id = parseInt(userId);
                if (isNaN(id)) return;

                setProjectsLoading(true);
                try {
                    let projectsData: (Project & { is_deleted?: boolean })[] = [];
                    if (showDeleted) {
                        const [allProjects, activeProjects] = await Promise.all([
                            listUserProjects(id, true),
                            listUserProjects(id, false)
                        ]);
                        const activeIds = new Set(activeProjects.map(p => p.id));
                        projectsData = allProjects.map(p => ({
                            ...p,
                            is_deleted: !activeIds.has(p.id)
                        }));
                    } else {
                        const activeProjects = await listUserProjects(id, false);
                        projectsData = activeProjects.map(p => ({
                            ...p,
                            is_deleted: false
                        }));
                    }
                    setProjects(projectsData);
                    
                    // Fetch task counts
                    const counts: Record<number, number> = {};
                    await Promise.all(projectsData.map(async (p) => {
                        try {
                            const tasks = await listUserProjectTasks(id, p.id);
                            counts[p.id] = tasks.length;
                        } catch (e) {
                            console.error(`Failed to fetch tasks for project ${p.id}:`, e);
                            counts[p.id] = 0;
                        }
                    }));
                    setTaskCounts(counts);
                } catch (e) {
                    console.error("Failed to fetch projects:", e);
                } finally {
                    setProjectsLoading(false);
                }
            };
            fetchProjects();
        }
    }, [tab, userId, showDeleted]);

    const tabs = [
        { id: "projects", label: "Projects", path: `/admin/users/${userId}/projects` },
        { id: "tasks", label: "Tasks", path: `/admin/users/${userId}/tasks` },
        { id: "tags", label: "Tags", path: `/admin/users/${userId}/tags` },
    ];

    const handleUpdateProject = async (projectId: number) => {
        if (!userId) return;
        const uId = parseInt(userId);
        if (isNaN(uId)) return;

        setIsUpdatingProject(true);
        try {
            const body: { name?: string; description?: string | null } = {};
            if (editingField === "name") body.name = editName;
            if (editingField === "description") body.description = editDescription || null;

            const updated = await updateUserProject(uId, projectId, body);
            
            // If server returns 204 (no content), 'updated' will be undefined.
            // We should fall back to manually updating the project in state to avoid crashes.
            setProjects(projects.map(p => {
                if (p.id === projectId) {
                    return {
                        ...(updated || {
                            ...p,
                            name: editingField === "name" ? editName : p.name,
                            description: editingField === "description" ? (editDescription || null) : p.description,
                            updated_at: new Date().toISOString()
                        }),
                        is_deleted: p.is_deleted
                    };
                }
                return p;
            }));
            setEditingProjectId(null);
            setEditingField(null);
        } catch (e) {
            console.error("Failed to update project:", e);
            alert("Failed to update project: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsUpdatingProject(false);
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!userId) return;
        const uId = parseInt(userId);
        if (isNaN(uId)) return;

        setIsDeletingProjectId(projectId);
        try {
            await deleteUserProject(uId, projectId);
            if (showDeleted) {
                // If we show deleted, just update the project in list
                setProjects(projects.map(p => p.id === projectId ? { ...p, is_deleted: true } : p));
            } else {
                setProjects(projects.filter(p => p.id !== projectId));
            }
        } catch (e) {
            console.error("Failed to delete project:", e);
            alert("Failed to delete project: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsDeletingProjectId(null);
        }
    };

    const handleRestoreProject = async (projectId: number) => {
        if (!userId) return;
        const uId = parseInt(userId);
        if (isNaN(uId)) return;

        setIsRestoringProjectId(projectId);
        try {
            await restoreUserProject(uId, projectId);
            // After restore, the project is no longer deleted
            setProjects(projects.map(p => p.id === projectId ? { ...p, is_deleted: false } : p));
        } catch (e) {
            console.error("Failed to restore project:", e);
            alert("Failed to restore project: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsRestoringProjectId(null);
        }
    };

    const startEditing = (project: Project, field: "name" | "description") => {
        setEditingProjectId(project.id);
        setEditingField(field);
        setEditName(project.name);
        setEditDescription(project.description || "");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link 
                    to="/admin/users"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-text-base">User Data <span className="text-text-muted font-normal ml-2">{user?.email || (loading ? "..." : `#${userId}`)}</span></h1>
            </div>

            <div className="bg-surface-2 rounded-2xl border border-surface-8 overflow-hidden">
                <div className="border-b border-surface-8 bg-surface-5/30 px-6">
                    <nav className="flex gap-8">
                        {tabs.map((t) => (
                            <NavLink
                                key={t.id}
                                to={t.path}
                                className={({ isActive }) =>
                                    `py-4 text-sm font-medium transition-colors relative ${
                                        isActive
                                            ? "text-brand-500"
                                            : "text-text-muted hover:text-text-base"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {t.label}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
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
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-text-base">Projects</h2>
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
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">ID</th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Name</th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Description</th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Tasks</th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Created At</th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px]">Updated At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {projects.length === 0 && !projectsLoading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-text-muted italic">
                                                        No projects found for this user.
                                                    </td>
                                                </tr>
                                            ) : (
                                                projects.map((project) => (
                                                    <tr key={project.id} className={`transition-colors group ${project.is_deleted ? 'opacity-60 bg-surface-5/30' : 'hover:bg-surface-5/50'}`}>
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">
                                                            <div className="flex items-center gap-2">
                                                                #{project.id}
                                                                {project.is_deleted ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                                                                            Deleted
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleRestoreProject(project.id)}
                                                                            disabled={isRestoringProjectId === project.id}
                                                                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-green-500 transition-all p-1 rounded-md hover:bg-green-500/10"
                                                                            title="Restore project"
                                                                        >
                                                                            {isRestoringProjectId === project.id ? (
                                                                                <div className="h-3.5 w-3.5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                                                                            ) : (
                                                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="23 4 23 10 17 10" />
                                                                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                                                                </svg>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleDeleteProject(project.id)}
                                                                        disabled={isDeletingProjectId === project.id}
                                                                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-500/10"
                                                                        title="Delete project"
                                                                    >
                                                                        {isDeletingProjectId === project.id ? (
                                                                            <div className="h-3.5 w-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                                                        ) : (
                                                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 font-medium text-text-base">
                                                            {project.is_deleted ? (
                                                                <div className="flex items-center gap-2">
                                                                    {project.name}
                                                                </div>
                                                            ) : editingProjectId === project.id && editingField === "name" ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        className="flex-1 bg-surface-5 border border-surface-10 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-500 min-w-[120px]"
                                                                        value={editName}
                                                                        onChange={(e) => setEditName(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") handleUpdateProject(project.id);
                                                                            if (e.key === "Escape") {
                                                                                setEditingProjectId(null);
                                                                                setEditingField(null);
                                                                            }
                                                                        }}
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <button
                                                                            onClick={() => handleUpdateProject(project.id)}
                                                                            disabled={isUpdatingProject}
                                                                            className="p-1 rounded bg-brand-500 text-on-brand hover:bg-brand-600 transition-colors disabled:opacity-50"
                                                                            title="Save"
                                                                        >
                                                                            {isUpdatingProject ? (
                                                                                <div className="h-3.5 w-3.5 border-2 border-on-brand/30 border-t-on-brand rounded-full animate-spin" />
                                                                            ) : (
                                                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingProjectId(null);
                                                                                setEditingField(null);
                                                                            }}
                                                                            disabled={isUpdatingProject}
                                                                            className="p-1 rounded bg-surface-8 text-text-base hover:bg-surface-10 transition-colors"
                                                                            title="Cancel"
                                                                        >
                                                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    {project.name}
                                                                    {!project.is_deleted && (
                                                                        <button 
                                                                            onClick={() => startEditing(project, "name")}
                                                                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-brand-500 transition-all"
                                                                            title="Edit name"
                                                                        >
                                                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted">
                                                            {project.is_deleted ? (
                                                                <div className="flex items-center justify-between gap-2 max-w-xs">
                                                                    <span className="truncate" title={project.description || ""}>
                                                                        {project.description || <span className="opacity-30 italic">No description</span>}
                                                                    </span>
                                                                </div>
                                                            ) : editingProjectId === project.id && editingField === "description" ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        className="flex-1 bg-surface-5 border border-surface-10 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-500 min-w-[150px]"
                                                                        value={editDescription}
                                                                        placeholder="No description"
                                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") handleUpdateProject(project.id);
                                                                            if (e.key === "Escape") {
                                                                                setEditingProjectId(null);
                                                                                setEditingField(null);
                                                                            }
                                                                        }}
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <button
                                                                            onClick={() => handleUpdateProject(project.id)}
                                                                            disabled={isUpdatingProject}
                                                                            className="p-1 rounded bg-brand-500 text-on-brand hover:bg-brand-600 transition-colors disabled:opacity-50"
                                                                            title="Save"
                                                                        >
                                                                            {isUpdatingProject ? (
                                                                                <div className="h-3.5 w-3.5 border-2 border-on-brand/30 border-t-on-brand rounded-full animate-spin" />
                                                                            ) : (
                                                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingProjectId(null);
                                                                                setEditingField(null);
                                                                            }}
                                                                            disabled={isUpdatingProject}
                                                                            className="p-1 rounded bg-surface-8 text-text-base hover:bg-surface-10 transition-colors"
                                                                            title="Cancel"
                                                                        >
                                                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between gap-2 max-w-xs">
                                                                    <span className="truncate" title={project.description || ""}>
                                                                        {project.description || <span className="opacity-30 italic">No description</span>}
                                                                    </span>
                                                                    {!project.is_deleted && (
                                                                        <button 
                                                                            onClick={() => startEditing(project, "description")}
                                                                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-brand-500 transition-all shrink-0"
                                                                            title="Edit description"
                                                                        >
                                                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-8 text-text-base text-xs font-medium">
                                                                {taskCounts[project.id] ?? 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(project.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(project.updated_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
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
                            <h2 className="text-lg font-semibold text-text-base">Tasks</h2>
                            <p className="text-sm text-text-muted italic">Data will be added here in a next step.</p>
                        </div>
                    )}
                    {tab === "tags" && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-text-base">Tags</h2>
                            <p className="text-sm text-text-muted italic">Data will be added here in a next step.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
