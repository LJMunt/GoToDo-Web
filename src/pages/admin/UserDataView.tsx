import { useParams, NavLink, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getUser, listUserProjects, listUserProjectTasks, updateUserProject, deleteUserProject, restoreUserProject, listUserTasks, deleteUserTask, restoreUserTask, listUserTags, deleteUserTag, type User, type Project, type Task, type Tag } from "../../api/admin";

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

const tagColorClasses: Record<string, string> = {
    slate: "bg-slate-500/10 text-text-muted/80 ring-slate-500/20",
    gray: "bg-gray-500/10 text-gray-500/80 ring-gray-500/20",
    red: "bg-red-500/10 text-red-500/80 ring-red-500/20",
    orange: "bg-brand-500/10 text-brand-500/80 ring-brand-500/20",
    amber: "bg-amber-500/10 text-amber-500/80 ring-amber-500/20",
    yellow: "bg-yellow-500/10 text-yellow-500/80 ring-yellow-500/20",
    lime: "bg-lime-500/10 text-lime-500/80 ring-lime-500/20",
    green: "bg-green-500/10 text-green-500/80 ring-green-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500/80 ring-emerald-500/20",
    teal: "bg-teal-500/10 text-teal-500/80 ring-teal-500/20",
    cyan: "bg-cyan-500/10 text-cyan-500/80 ring-cyan-500/20",
    sky: "bg-sky-500/10 text-sky-500/80 ring-sky-500/20",
    blue: "bg-blue-500/10 text-blue-500/80 ring-blue-500/20",
    indigo: "bg-indigo-500/10 text-indigo-500/80 ring-indigo-500/20",
    violet: "bg-violet-500/10 text-violet-500/80 ring-violet-500/20",
    purple: "bg-purple-500/10 text-purple-500/80 ring-purple-500/20",
    pink: "bg-pink-500/10 text-pink-500/80 ring-pink-500/20",
};

export default function UserDataView() {
    const { userId, tab } = useParams<{ userId: string; tab: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<(Project & { is_deleted?: boolean })[]>([]);
    const [taskCounts, setTaskCounts] = useState<Record<number, number>>({});
    const [projectsLoading, setProjectsLoading] = useState(false);
    
    const [tasks, setTasks] = useState<(Task & { is_deleted?: boolean })[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [taskSortField, setTaskSortField] = useState<keyof Task>("id");
    const [taskSortDirection, setTaskSortDirection] = useState<"asc" | "desc">("asc");
    const [isDeletingTaskId, setIsDeletingTaskId] = useState<number | null>(null);
    const [isRestoringTaskId, setIsRestoringTaskId] = useState<number | null>(null);

    const [tags, setTags] = useState<Tag[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagSortField, setTagSortField] = useState<keyof Tag>("id");
    const [tagSortDirection, setTagSortDirection] = useState<"asc" | "desc">("asc");
    const [isDeletingTagId, setIsDeletingTagId] = useState<number | null>(null);

    const [showDeleted, setShowDeleted] = useState(false);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof Project | "tasks">("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

    useEffect(() => {
        if (tab === "tasks" && userId) {
            const fetchTasks = async () => {
                const id = parseInt(userId);
                if (isNaN(id)) return;

                setTasksLoading(true);
                try {
                    let tasksData: (Task & { is_deleted?: boolean })[] = [];
                    if (showDeleted) {
                        const [allTasks, activeTasks] = await Promise.all([
                            listUserTasks(id, true),
                            listUserTasks(id, false)
                        ]);
                        const activeIds = new Set(activeTasks.map(t => t.id));
                        tasksData = allTasks.map(t => ({
                            ...t,
                            is_deleted: !activeIds.has(t.id)
                        }));
                    } else {
                        const activeTasks = await listUserTasks(id, false);
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
    }, [tab, userId, showDeleted]);

    const tabs = [
        {
            id: "projects",
            label: "Projects",
            path: `/admin/users/${userId}/projects`,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
            )
        },
        {
            id: "tasks",
            label: "Tasks",
            path: `/admin/users/${userId}/tasks`,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        {
            id: "tags",
            label: "Tags",
            path: `/admin/users/${userId}/tags`,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            )
        },
    ];

    useEffect(() => {
        if (tab === "tags" && userId) {
            const fetchTags = async () => {
                const id = parseInt(userId);
                if (isNaN(id)) return;

                setTagsLoading(true);
                try {
                    const data = await listUserTags(id);
                    setTags(data);
                } catch (e) {
                    console.error("Failed to fetch tags:", e);
                } finally {
                    setTagsLoading(false);
                }
            };
            fetchTags();
        }
    }, [tab, userId]);

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

    const handleDeleteTask = async (taskId: number) => {
        if (!userId) return;
        const uId = parseInt(userId);
        if (isNaN(uId)) return;

        setIsDeletingTaskId(taskId);
        try {
            await deleteUserTask(uId, taskId);
            if (showDeleted) {
                setTasks(tasks.map(t => t.id === taskId ? { ...t, is_deleted: true } : t));
            } else {
                setTasks(tasks.filter(t => t.id !== taskId));
            }
        } catch (e) {
            console.error("Failed to delete task:", e);
            alert("Failed to delete task: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsDeletingTaskId(null);
        }
    };

    const handleRestoreTask = async (taskId: number) => {
        if (!userId) return;
        const uId = parseInt(userId);
        if (isNaN(uId)) return;

        setIsRestoringTaskId(taskId);
        try {
            await restoreUserTask(uId, taskId);
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_deleted: false } : t));
        } catch (e) {
            console.error("Failed to restore task:", e);
            alert("Failed to restore task: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsRestoringTaskId(null);
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        if (!userId) return;
        const uId = parseInt(userId);
        if (isNaN(uId)) return;

        if (!confirm("Are you sure you want to delete this tag? This action cannot be undone.")) return;

        setIsDeletingTagId(tagId);
        try {
            await deleteUserTag(uId, tagId);
            setTags(tags.filter(t => t.id !== tagId));
        } catch (e) {
            console.error("Failed to delete tag:", e);
            alert("Failed to delete tag: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsDeletingTagId(null);
        }
    };

    const toggleSort = (field: keyof Project | "tasks") => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const toggleTaskSort = (field: keyof Task) => {
        if (taskSortField === field) {
            setTaskSortDirection(taskSortDirection === "asc" ? "desc" : "asc");
        } else {
            setTaskSortField(field);
            setTaskSortDirection("asc");
        }
    };

    const toggleTagSort = (field: keyof Tag) => {
        if (tagSortField === field) {
            setTagSortDirection(tagSortDirection === "asc" ? "desc" : "asc");
        } else {
            setTagSortField(field);
            setTagSortDirection("asc");
        }
    };

    const filteredProjects = useMemo(() => {
        const filtered = projects.filter(project => {
            const matchesSearch = 
                project.name.toLowerCase().includes(search.toLowerCase()) || 
                (project.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
                project.id.toString().includes(search);
            return matchesSearch;
        });

        return [...filtered].sort((a, b) => {
            let valA: string | number | null | undefined;
            let valB: string | number | null | undefined;

            if (sortField === "tasks") {
                valA = taskCounts[a.id] ?? 0;
                valB = taskCounts[b.id] ?? 0;
            } else {
                valA = a[sortField];
                valB = b[sortField];
            }

            if (valA === null || valA === undefined) return sortDirection === "asc" ? -1 : 1;
            if (valB === null || valB === undefined) return sortDirection === "asc" ? 1 : -1;

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [projects, search, sortField, sortDirection, taskCounts]);

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
                tag.color.toLowerCase().includes(search.toLowerCase()) ||
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
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("id")}>
                                                    <div className="flex items-center gap-1">
                                                        ID
                                                        <SortIcon field="id" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("name")}>
                                                    <div className="flex items-center gap-1">
                                                        Name
                                                        <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("description")}>
                                                    <div className="flex items-center gap-1">
                                                        Description
                                                        <SortIcon field="description" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("tasks")}>
                                                    <div className="flex items-center gap-1">
                                                        Tasks
                                                        <SortIcon field="tasks" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("created_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Created At
                                                        <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleSort("updated_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Updated At
                                                        <SortIcon field="updated_at" currentField={sortField} direction={sortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {filteredProjects.length === 0 && !projectsLoading ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted italic">
                                                        {search ? "No projects found matching your search." : "No projects found for this user."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredProjects.map((project) => (
                                                    <tr key={project.id} className={`transition-colors group ${project.is_deleted ? 'opacity-60 bg-surface-5/30' : 'hover:bg-surface-5/50'}`}>
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">
                                                            #{project.id}
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
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {project.is_deleted ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                                                                            Deleted
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleRestoreProject(project.id)}
                                                                            disabled={isRestoringProjectId === project.id}
                                                                            className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                                                            title="Restore project"
                                                                        >
                                                                            {isRestoringProjectId === project.id ? (
                                                                                <div className="h-4 w-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                                                                            ) : (
                                                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
                                                                                </svg>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleDeleteProject(project.id)}
                                                                        disabled={isDeletingProjectId === project.id}
                                                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                                                        title="Delete project"
                                                                    >
                                                                        {isDeletingProjectId === project.id ? (
                                                                            <div className="h-4 w-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                                                        ) : (
                                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M3 6h18" />
                                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                                                <line x1="14" y1="11" x2="14" y2="17" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
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
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTaskSort("id")}>
                                                    <div className="flex items-center gap-1">
                                                        ID
                                                        <SortIcon field="id" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTaskSort("title")}>
                                                    <div className="flex items-center gap-1">
                                                        Title
                                                        <SortIcon field="title" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTaskSort("description")}>
                                                    <div className="flex items-center gap-1">
                                                        Description
                                                        <SortIcon field="description" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTaskSort("completed_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Status
                                                        <SortIcon field="completed_at" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTaskSort("repeat_every")}>
                                                    <div className="flex items-center gap-1">
                                                        Repeat
                                                        <SortIcon field="repeat_every" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTaskSort("created_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Created At
                                                        <SortIcon field="created_at" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTaskSort("project_id")}>
                                                    <div className="flex items-center gap-1">
                                                        Project
                                                        <SortIcon field="project_id" currentField={taskSortField} direction={taskSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {filteredTasks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                                                        {tasksLoading ? "Loading tasks..." : "No tasks found."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTasks.map((task) => (
                                                    <tr key={task.id} className={`group hover:bg-surface-5/50 transition-colors ${task.is_deleted ? 'opacity-60 bg-surface-10/20' : ''}`}>
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">#{task.id}</td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-medium ${task.is_deleted ? 'line-through text-text-muted' : 'text-text-base'}`}>
                                                                    {task.title}
                                                                </span>
                                                                {task.is_deleted && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                                                                        Deleted
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted truncate max-w-xs" title={task.description || ""}>
                                                            {task.description || <span className="opacity-30 italic">No description</span>}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {task.completed_at ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Completed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-10 text-text-muted text-xs font-medium border border-surface-20">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted text-xs">
                                                            {task.repeat_every && task.repeat_unit && task.repeat_unit !== "null" ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                    </svg>
                                                                    {task.repeat_every} {task.repeat_unit}{task.repeat_every > 1 ? 's' : ''}
                                                                </span>
                                                            ) : (
                                                                <span className="opacity-30">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(task.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-8 text-text-base text-xs font-medium">
                                                                #{task.project_id}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {task.is_deleted ? (
                                                                    <button
                                                                        onClick={() => handleRestoreTask(task.id)}
                                                                        disabled={isRestoringTaskId === task.id}
                                                                        className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                                                        title="Restore task"
                                                                    >
                                                                        {isRestoringTaskId === task.id ? (
                                                                            <div className="h-4 w-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                                                                        ) : (
                                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleDeleteTask(task.id)}
                                                                        disabled={isDeletingTaskId === task.id}
                                                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                                                        title="Delete task"
                                                                    >
                                                                        {isDeletingTaskId === task.id ? (
                                                                            <div className="h-4 w-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                                                        ) : (
                                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M3 6h18" />
                                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                                                <line x1="14" y1="11" x2="14" y2="17" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
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
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTagSort("id")}>
                                                    <div className="flex items-center gap-1">
                                                        ID
                                                        <SortIcon field="id" currentField={tagSortField} direction={tagSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTagSort("name")}>
                                                    <div className="flex items-center gap-1">
                                                        Name
                                                        <SortIcon field="name" currentField={tagSortField} direction={tagSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTagSort("color")}>
                                                    <div className="flex items-center gap-1">
                                                        Color
                                                        <SortIcon field="color" currentField={tagSortField} direction={tagSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] cursor-pointer hover:text-text-base transition-colors group" onClick={() => toggleTagSort("created_at")}>
                                                    <div className="flex items-center gap-1">
                                                        Created At
                                                        <SortIcon field="created_at" currentField={tagSortField} direction={tagSortDirection} />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 uppercase tracking-wider text-[11px] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-8">
                                            {filteredTags.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                                                        {tagsLoading ? "Loading tags..." : (search ? "No tags found matching your search." : "No tags found.")}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTags.map((tag) => (
                                                    <tr key={tag.id} className="group hover:bg-surface-5/50 transition-colors">
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">#{tag.id}</td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ring-1 ring-inset ${tagColorClasses[tag.color] || "bg-surface-10 text-text-muted ring-surface-20"}`}>
                                                                    {tag.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted italic">
                                                            {tag.color}
                                                        </td>
                                                        <td className="px-4 py-4 text-text-muted whitespace-nowrap">
                                                            {new Date(tag.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleDeleteTag(tag.id)}
                                                                    disabled={isDeletingTagId === tag.id}
                                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                                                    title="Delete tag"
                                                                >
                                                                    {isDeletingTagId === tag.id ? (
                                                                        <div className="h-4 w-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                                                    ) : (
                                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3 6h18" />
                                                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                            <line x1="10" y1="11" x2="10" y2="17" />
                                                                            <line x1="14" y1="11" x2="14" y2="17" />
                                                                        </svg>
                                                                    )}
                                                                </button>
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
                </div>
            </div>
        </div>
    );
}
