import { useParams, NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, listUserProjects, listUserProjectTasks, type User, type Project } from "../../api/admin";

export default function UserDataView() {
    const { userId, tab } = useParams<{ userId: string; tab: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [taskCounts, setTaskCounts] = useState<Record<number, number>>({});
    const [projectsLoading, setProjectsLoading] = useState(false);

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
                    const projectsData = await listUserProjects(id);
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
    }, [tab, userId]);

    const tabs = [
        { id: "projects", label: "Projects", path: `/admin/users/${userId}/projects` },
        { id: "tasks", label: "Tasks", path: `/admin/users/${userId}/tasks` },
        { id: "tags", label: "Tags", path: `/admin/users/${userId}/tags` },
    ];

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
                                {projectsLoading && <div className="text-xs text-text-muted animate-pulse">Loading data...</div>}
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
                                                    <tr key={project.id} className="hover:bg-surface-5/50 transition-colors">
                                                        <td className="px-4 py-4 font-mono text-xs text-text-muted">#{project.id}</td>
                                                        <td className="px-4 py-4 font-medium text-text-base">{project.name}</td>
                                                        <td className="px-4 py-4 text-text-muted max-w-xs truncate" title={project.description || ""}>
                                                            {project.description || <span className="opacity-30 italic">No description</span>}
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
