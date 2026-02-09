import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAgenda } from "../api/agenda";
import { listProjectTasks, listProjects } from "../api/projects";
import { listTaskOccurrences, setOccurrenceCompletion, setTaskCompletion, getTaskTags } from "../api/tasks";
import type { components } from "../api/schema";
import { useAuth } from "../features/auth/AuthContext";
import { useConfig } from "../features/config/ConfigContext";
import { TaskEditModal } from "./TaskEditModal";
import { TaskCreateModal } from "./TaskCreateModal";
import { ProjectEditModal } from "./ProjectEditModal";
import { ProjectCreateModal } from "./ProjectCreateModal";
import { TagsManagementModal } from "./TagsManagementModal";

type AgendaItem = components["schemas"]["AgendaItem"];
type Project = components["schemas"]["Project"];
type Task = components["schemas"]["Task"];
type Tag = components["schemas"]["Tag"];

const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
});

function dayRange(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return {
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        label: formatter.format(date),
    };
}

function formatInputDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatTime(value: string) {
    const date = new Date(value);
    return timeFormatter.format(date);
}

function formatDue(value: string | null | undefined) {
    if (!value) return "No due date";
    const date = new Date(value);
    return `${formatter.format(date)} · ${timeFormatter.format(date)}`;
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

function TaskTags({ tags }: { tags?: Tag[] }) {
    if (!tags || tags.length === 0) return null;
    return (
        <div className="mt-2.5 flex flex-wrap gap-2">
            {tags.map(tag => {
                const colorClass = tagColorClasses[tag.color] || tagColorClasses.slate;
                return (
                    <span
                        key={tag.id}
                        className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-tight ring-1 ${colorClass}`}
                    >
                        {tag.name}
                    </span>
                );
            })}
        </div>
    );
}

function isAgendaCompleted(item: AgendaItem): boolean {
    const maybeCompletedAt = (item as { completed_at?: string | null }).completed_at;
    const maybeCompleted = (item as { completed?: boolean }).completed;
    return Boolean(maybeCompletedAt) || Boolean(maybeCompleted);
}

function isTaskCompleted(task: Task) {
    return Boolean(task.completed_at) || Boolean((task as { completed?: boolean }).completed);
}

export default function HomePage() {
    const { state } = useAuth();
    const { config } = useConfig();
    const user = state.status === "authenticated" ? state.user : null;
    const [agendaDate, setAgendaDate] = useState(() => new Date());
    const agendaDay = useMemo(() => dayRange(agendaDate), [agendaDate]);
    const agendaDateInput = useMemo(() => formatInputDate(agendaDate), [agendaDate]);

    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [agendaLoading, setAgendaLoading] = useState(true);
    const [agendaError, setAgendaError] = useState<string | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);
    const { projectId } = useParams();
    const nav = useNavigate();
    const selectedProjectId = useMemo(() => {
        if (!projectId) return null;
        const id = parseInt(projectId, 10);
        return isNaN(id) ? null : id;
    }, [projectId]);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksError, setTasksError] = useState<string | null>(null);
    const [expandedRecurring, setExpandedRecurring] = useState<Set<number>>(new Set());
    const [taskOccurrences, setTaskOccurrences] = useState<
        Record<number, { loading: boolean; error: string | null; items: components["schemas"]["Occurrence"][] }>
    >({});

    const [completingKeys, setCompletingKeys] = useState<Set<string>>(new Set());
    const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());
    const [showCompletedAgenda, setShowCompletedAgenda] = useState(user?.settings?.showCompletedDefault ?? false);
    const [showCompletedProjectTasks, setShowCompletedProjectTasks] = useState(user?.settings?.showCompletedDefault ?? false);

    useEffect(() => {
        if (user) {
            setShowCompletedAgenda(user.settings?.showCompletedDefault ?? false);
            setShowCompletedProjectTasks(user.settings?.showCompletedDefault ?? false);
        }
    }, [user?.settings?.showCompletedDefault]);
    const [completedAgendaHistory, setCompletedAgendaHistory] = useState<AgendaItem[]>([]);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [tagsByTaskId, setTagsByTaskId] = useState<Record<number, Tag[]>>({});
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProjectCreateModal, setShowProjectCreateModal] = useState(false);
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [extraCompletedItems, setExtraCompletedItems] = useState<AgendaItem[]>([]);
    const [isLoadingExtra, setIsLoadingExtra] = useState(false);

    const loadAgenda = useCallback(async () => {
        setAgendaLoading(true);
        setAgendaError(null);
        setAgendaItems([]);
        setCompletedAgendaHistory([]);
        try {
            const data = await getAgenda({ from: agendaDay.startISO, to: agendaDay.endISO });
            setAgendaItems(data);
            void loadTagsForTasks(data.map(item => item.task_id));
        } catch (err) {
            setAgendaError(err instanceof Error ? err.message : "Failed to load agenda");
        } finally {
            setAgendaLoading(false);
        }
    }, [agendaDay.endISO, agendaDay.startISO]);

    useEffect(() => {
        void loadAgenda();
    }, [loadAgenda]);

    const loadProjects = useCallback(async () => {
        setProjectsLoading(true);
        setProjectsError(null);
        try {
            const data = await listProjects();
            setProjects(data);
        } catch (err) {
            setProjectsError(err instanceof Error ? err.message : "Failed to load projects");
        } finally {
            setProjectsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects]);

    const loadTagsForTasks = useCallback(async (taskIds: number[], force = false) => {
        const uniqueIds = [...new Set(taskIds)].filter(id => force || !tagsByTaskId[id]);
        if (uniqueIds.length === 0) return;

        try {
            const results = await Promise.all(
                uniqueIds.map(id => getTaskTags(id).then(tags => ({ id, tags })))
            );
            setTagsByTaskId(prev => {
                const next = { ...prev };
                results.forEach(({ id, tags }) => {
                    next[id] = tags;
                });
                return next;
            });
        } catch (err) {
            console.error("Failed to load task tags", err);
        }
    }, [tagsByTaskId]);

    const loadTasks = useCallback(async () => {
        if (selectedProjectId === null) return;
        setTasksLoading(true);
        setTasksError(null);
        try {
            const data = await listProjectTasks(selectedProjectId);
            setTasks(data);
            void loadTagsForTasks(data.map(t => t.id));
        } catch (err) {
            setTasksError(err instanceof Error ? err.message : "Failed to load tasks");
        } finally {
            setTasksLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const sortedAgenda = useMemo(
        () =>
            [...agendaItems].sort(
                (a, b) =>
                    new Date(a.due_at).getTime() -
                    new Date(b.due_at).getTime()
            ),
        [agendaItems]
    );

    const agendaKey = (item: AgendaItem) =>
        item.kind === "occurrence"
            ? `occ-${item.occurrence_id ?? ""}-${item.task_id}`
            : `task-${item.task_id}`;

    const mergedAgenda = useMemo(() => {
        const map = new Map<string, AgendaItem>();
        [...sortedAgenda, ...extraCompletedItems, ...completedAgendaHistory].forEach((item) => {
            const key = agendaKey(item);
            const existing = map.get(key);
            if (existing && isAgendaCompleted(existing)) return;
            map.set(key, item);
        });
        return Array.from(map.values());
    }, [completedAgendaHistory, sortedAgenda, extraCompletedItems]);

    const projectNameMap = useMemo(() => {
        const map = new Map<number, string>();
        projects.forEach((project) => map.set(project.id, project.name));
        return map;
    }, [projects]);

    const currentProject = useMemo(() =>
        projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]);

    const fetchExtraCompletedItems = useCallback(async () => {
        if (!showCompletedAgenda || projects.length === 0) {
            setExtraCompletedItems([]);
            return;
        }

        setIsLoadingExtra(true);
        try {
            // Fetch all tasks for all projects to find recurring ones and completed single tasks
            const tasksByProject = await Promise.all(projects.map(p => listProjectTasks(p.id)));

            const recurringTasks: { task: Task; projectId: number }[] = [];
            const completedSingleTasks: AgendaItem[] = [];
            const dayStart = new Date(agendaDay.startISO);
            const dayEnd = new Date(agendaDay.endISO);

            tasksByProject.forEach((pTasks, idx) => {
                const pId = projects[idx].id;
                pTasks.forEach(t => {
                    if (t.repeat_every != null) {
                        recurringTasks.push({ task: t, projectId: pId });
                    } else if (t.completed_at && t.due_at) {
                        const due = new Date(t.due_at);
                        if (due >= dayStart && due <= dayEnd) {
                            completedSingleTasks.push({
                                kind: "task",
                                task_id: t.id,
                                project_id: pId,
                                title: t.title,
                                description: t.description,
                                due_at: t.due_at,
                                completed_at: t.completed_at
                            } as AgendaItem);
                        }
                    }
                });
            });

            // Fetch occurrences for recurring tasks for this specific day
            const occurrencesResults = await Promise.all(
                recurringTasks.map(rt =>
                    listTaskOccurrences(rt.task.id, { from: agendaDay.startISO, to: agendaDay.endISO })
                        .then(occs => ({ rt, occs }))
                        .catch(() => ({ rt, occs: [] }))
                )
            );

            const completedOccurrences: AgendaItem[] = [];
            occurrencesResults.forEach(({ rt, occs }) => {
                occs.forEach(occ => {
                    if (occ.completed_at) {
                        completedOccurrences.push({
                            kind: "occurrence",
                            task_id: rt.task.id,
                            occurrence_id: occ.id,
                            project_id: rt.projectId,
                            title: rt.task.title,
                            description: rt.task.description,
                            due_at: occ.due_at,
                            completed_at: occ.completed_at
                        } as AgendaItem);
                    }
                });
            });

            setExtraCompletedItems([...completedSingleTasks, ...completedOccurrences]);
            void loadTagsForTasks([...completedSingleTasks, ...completedOccurrences].map(item => item.task_id));
        } catch (err) {
            console.error("Failed to fetch extra completed items", err);
        } finally {
            setIsLoadingExtra(false);
        }
    }, [showCompletedAgenda, projects, agendaDay]);

    useEffect(() => {
        if (showCompletedAgenda) {
            void fetchExtraCompletedItems();
        } else {
            setExtraCompletedItems([]);
        }
    }, [showCompletedAgenda, fetchExtraCompletedItems]);

    async function refreshAgendaAndTasks() {
        try {
            const [agendaData, taskData] = await Promise.all([
                getAgenda({ from: agendaDay.startISO, to: agendaDay.endISO }),
                selectedProjectId ? listProjectTasks(selectedProjectId) : Promise.resolve(tasks),
            ]);
            setAgendaItems(agendaData);
            if (selectedProjectId) setTasks(taskData as Task[]);

            const allTaskIds = [
                ...agendaData.map(item => item.task_id),
                ...(selectedProjectId ? (taskData as Task[]).map(t => t.id) : []),
            ];
            void loadTagsForTasks(allTaskIds, true);

            if (showCompletedAgenda) {
                void fetchExtraCompletedItems();
            }
        } catch (err) {
            console.warn("Refresh failed", err);
        }
    }

    async function handleToggleAgenda(item: AgendaItem) {
        const key = agendaKey(item);
        const completed = isAgendaCompleted(item);
        const willVanish = !completed && !showCompletedAgenda;

        if (willVanish) {
            setRemovingKeys((prev) => new Set(prev).add(key));
        }

        setCompletingKeys((prev) => new Set(prev).add(key));
        try {
            if (item.kind === "occurrence" && item.occurrence_id != null) {
                await setOccurrenceCompletion(item.task_id, item.occurrence_id, !completed);
            } else {
                await setTaskCompletion(item.task_id, !completed, tagsByTaskId[item.task_id] ?? []);
            }

            if (willVanish) {
                // Keep the item visible for the duration of the vanishing animation
                await new Promise((resolve) => setTimeout(resolve, 600));
            }

            await refreshAgendaAndTasks();
        } catch (err) {
            console.error("Unable to update completion", err);
            setRemovingKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        } finally {
            setCompletingKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            if (willVanish) {
                setRemovingKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        }

        setCompletedAgendaHistory((prev) => {
            const next = new Map(prev.map((p) => [agendaKey(p), p]));
            if (completed) {
                next.delete(key);
            } else {
                next.set(key, { ...item, completed: true } as AgendaItem);
            }
            return Array.from(next.values());
        });
    }

    async function handleToggleProjectTask(task: Task) {
        const key = `project-task-${task.id}`;
        const completed = isTaskCompleted(task);
        if (task.repeat_every != null) return;
        
        const willVanish = !completed && !showCompletedProjectTasks;
        if (willVanish) {
            setRemovingKeys((prev) => new Set(prev).add(key));
        }

        setCompletingKeys((prev) => new Set(prev).add(key));
        try {
            await setTaskCompletion(task.id, !completed, tagsByTaskId[task.id] ?? []);
            
            if (willVanish) {
                await new Promise((resolve) => setTimeout(resolve, 600));
            }

            await refreshAgendaAndTasks();
        } catch (err) {
            console.error("Unable to update task", err);
            setRemovingKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        } finally {
            setCompletingKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            if (willVanish) {
                setRemovingKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        }
    }

    if (!user) return null;

    const filteredAgenda = mergedAgenda.filter(
        (item) => showCompletedAgenda || !isAgendaCompleted(item) || removingKeys.has(agendaKey(item))
    );

    const filteredTasks = tasks.filter((task) => {
        if (task.repeat_every != null) return true; // always show recurring templates so their occurrences can be viewed
        return showCompletedProjectTasks || !isTaskCompleted(task) || removingKeys.has(`project-task-${task.id}`);
    });

    async function handleToggleOccurrence(taskId: number, occurrence: components["schemas"]["Occurrence"]) {
        const key = `occ-list-${taskId}-${occurrence.id}`;
        const completed = Boolean(occurrence.completed_at);
        setCompletingKeys((prev) => new Set(prev).add(key));
        try {
            await setOccurrenceCompletion(taskId, occurrence.id, !completed);
            setTaskOccurrences((prev) => {
                const current = prev[taskId];
                if (!current) return prev;
                const updated = current.items.map((item) =>
                    item.id === occurrence.id ? { ...item, completed_at: !completed ? new Date().toISOString() : null } : item
                );
                return { ...prev, [taskId]: { ...current, items: updated } };
            });
            await refreshAgendaAndTasks();
        } catch (err) {
            console.error("Unable to update occurrence", err);
        } finally {
            setCompletingKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }

    async function toggleRecurringExpansion(task: Task) {
        if (!task.repeat_every) return;
        setExpandedRecurring((prev) => {
            const next = new Set(prev);
            if (next.has(task.id)) next.delete(task.id);
            else next.add(task.id);
            return next;
        });

        // Always refresh on expansion so completed occurrences show up
        setTaskOccurrences((prev) => ({
            ...prev,
            [task.id]: { loading: true, error: null, items: prev[task.id]?.items ?? [] },
        }));

        try {
            const items = await listTaskOccurrences(task.id);
            setTaskOccurrences((prev) => ({
                ...prev,
                [task.id]: { loading: false, error: null, items },
            }));
        } catch (err) {
            setTaskOccurrences((prev) => ({
                ...prev,
                [task.id]: {
                    loading: false,
                    error: err instanceof Error ? err.message : "Failed to load occurrences",
                    items: prev[task.id]?.items ?? [],
                },
            }));
        }
    }


    return (
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-8">
                <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                        Navigation
                    </h2>
                    <div className="mt-4 space-y-1">
                        <button
                            onClick={() => nav("/")}
                            className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all relative group/nav ${
                                selectedProjectId === null
                                    ? "bg-surface-8 text-text-base font-black uppercase tracking-widest ring-1 ring-surface-15 shadow-sm"
                                    : "text-text-muted hover:bg-surface-5 hover:text-text-base font-bold"
                            }`}
                        >
                            {selectedProjectId === null && (
                                <div className="absolute left-0 h-6 w-1 rounded-r-full bg-brand-500 shadow-brand-500/80 shadow-md" />
                            )}
                            <svg className={`h-5 w-5 transition-colors ${selectedProjectId === null ? "text-brand-500" : "group-hover/nav:text-text-300"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            <span className="text-sm">{config.navigation.agenda}</span>
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                                {config.navigation.projects}
                            </h2>
                            <button
                                onClick={() => setShowProjectCreateModal(true)}
                                className="flex h-5 w-5 items-center justify-center rounded-lg bg-surface-5 text-text-muted transition-all hover:bg-surface-10 hover:text-brand-500 cursor-pointer"
                            >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                        </div>
                        <span className="rounded-full bg-surface-5 px-2 py-0.5 text-[10px] font-bold text-text-muted ring-1 ring-surface-10">
                            {projects.length}
                        </span>
                    </div>

                    <div className="mt-4 space-y-1">
                        {projectsLoading && (
                            <div className="space-y-3 px-4 py-2">
                                <div className="h-3 w-3/4 animate-pulse rounded bg-surface-5" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-5" />
                            </div>
                        )}

                        {projectsError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                                {projectsError}
                            </div>
                        )}

                        {!projectsLoading && !projectsError && projects.length === 0 && (
                            <div className="px-4 py-3 text-sm text-text-muted italic">
                                No projects yet.
                            </div>
                        )}

                        {!projectsLoading &&
                            !projectsError &&
                            projects.map((project) => {
                                const isActive = project.id === selectedProjectId;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => nav(`/projects/${project.id}`)}
                                        className={`group flex w-full flex-col rounded-2xl px-5 py-4 text-left transition-all ${
                                            isActive
                                                ? "bg-surface-8 ring-1 ring-surface-15 shadow-sm"
                                                : "text-text-muted hover:bg-surface-5 hover:text-text-base"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${isActive ? "bg-brand-500 shadow-brand-500/60 shadow-sm scale-125" : "bg-surface-15 group-hover:bg-text-muted"}`} />
                                                <span className={`text-sm tracking-tight ${isActive ? "text-text-base font-black uppercase tracking-widest" : "font-bold"}`}>
                                                    {project.name}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingProjectId(project.id);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted/20 transition-all hover:bg-surface-10 hover:text-text-base group-hover:opacity-100 opacity-0 cursor-pointer border border-transparent hover:border-surface-15"
                                            >
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.121a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                        </div>
                                        {project.description && (
                                            <p className={`mt-2 ml-5.5 line-clamp-1 text-[11px] font-medium transition-colors ${isActive ? "text-text-muted" : "text-text-muted/60 group-hover:text-text-muted"}`}>
                                                {project.description}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            </aside>

            <section className="min-w-0">
                {selectedProjectId === null ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-text-base lg:text-5xl">
                                    {config.ui.agendaTitle}
                                </h1>
                                <div className="mt-2 flex items-center gap-2">
                                    <p className="text-text-muted">
                                        {agendaDay.label} • {filteredAgenda.length} items
                                    </p>
                                    {isLoadingExtra && (
                                        <svg className="h-3 w-3 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={agendaDateInput}
                                        onChange={(e) => {
                                            if (e.target.value) setAgendaDate(new Date(`${e.target.value}T00:00:00`));
                                        }}
                                        className="rounded-xl border border-surface-10 bg-surface-3 px-4 py-2 text-sm text-text-200 outline-none transition-all group-hover:border-surface-15 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAgendaDate(new Date())}
                                    className="rounded-xl bg-surface-5 px-4 py-2 text-sm font-medium text-text-300 transition-all hover:bg-surface-10 hover:text-text-base active:scale-95"
                                >
                                    {config.ui.today}
                                </button>
                                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-5 px-4 py-2 text-sm text-text-300 transition-all hover:bg-surface-10 active:scale-95">
                                    <input
                                        type="checkbox"
                                        checked={showCompletedAgenda}
                                        onChange={(e) => setShowCompletedAgenda(e.target.checked)}
                                        className="h-4 w-4 rounded border-surface-15 bg-transparent text-brand-500/70 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="select-none">{config.ui.showCompleted}</span>
                                </label>
                                <button
                                    onClick={() => setShowTagsModal(true)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-5 text-text-muted transition-all hover:bg-surface-10 hover:text-text-base active:scale-95 cursor-pointer"
                                    title="Manage Tags"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {agendaLoading && (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 animate-pulse rounded-3xl bg-surface-3" />
                                    ))}
                                </div>
                            )}

                            {agendaError && (
                                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
                                    <p className="text-red-400 font-medium">{agendaError}</p>
                                </div>
                            )}

                            {!agendaLoading && !agendaError && filteredAgenda.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-5xl border border-dashed border-surface-10 bg-surface-3 py-24 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-3 text-text-muted">
                                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-text-200">{config.ui.agendaEmptyStateTitle}</h3>
                                    <p className="mt-2 text-text-muted max-w-xs mx-auto">{config.ui.agendaEmptyStateText}</p>
                                </div>
                            )}

                            {!agendaLoading &&
                                !agendaError &&
                                filteredAgenda.map((item) => {
                                    const projectName = projectNameMap.get(item.project_id) ?? "Project";
                                    const key = agendaKey(item);
                                    const isCompleting = completingKeys.has(key);
                                    const isVanishing = removingKeys.has(key);
                                    const completed = isAgendaCompleted(item);
                                    const showCompletedVisuals = completed || isVanishing;

                                    return (
                                        <div
                                            key={key}
                                            className={`group relative flex items-start gap-6 rounded-4xl border border-surface-5 bg-surface-3 p-6 transition-all hover:bg-surface-5 hover:border-surface-10 hover:scale-[1.01] hover:shadow-2xl hover:shadow-black/20 ${showCompletedVisuals ? "opacity-40 grayscale-[0.5]" : ""} ${isVanishing ? "animate-vanish" : ""}`}
                                        >
                                            <div className="relative flex-shrink-0 mt-1">
                                                <button
                                                    onClick={() => handleToggleAgenda(item)}
                                                    disabled={isCompleting}
                                                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 cursor-pointer ${
                                                        isCompleting
                                                            ? "border-brand-500/50 animate-wiggle"
                                                            : showCompletedVisuals
                                                                ? "border-brand-500 bg-brand-500/10 text-brand-500 shadow-[0_0_15px_rgba(var(--brand-500-rgb),0.2)]"
                                                                : "border-surface-10 text-transparent hover:border-brand-500/40 hover:text-brand-500/40"
                                                    }`}
                                                >
                                                    <svg className={`h-7 w-7 ${(showCompletedVisuals && !isCompleting) ? "animate-pop" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                </button>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${item.kind === "occurrence" ? "text-brand-500" : "text-brand-500/40 opacity-0 group-hover:opacity-100"}`}>
                                                        {item.kind === "occurrence" ? "Recurring" : "Task"}
                                                    </span>
                                                    <span className={`h-1 w-1 rounded-full bg-surface-10 transition-opacity duration-300 ${item.kind === "task" ? "opacity-0 group-hover:opacity-100" : ""}`} />
                                                    <span className="truncate text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                                                        {projectName}
                                                    </span>
                                                </div>
                                                <h3 className={`mt-2 truncate text-lg font-bold tracking-tight transition-all ${completed ? "text-text-muted line-through" : "text-text-base group-hover:text-brand-600"}`}>
                                                    {item.title}
                                                </h3>
                                                <TaskTags tags={tagsByTaskId[item.task_id]} />
                                            </div>

                                            <div className="flex flex-col items-end gap-3 flex-shrink-0 mt-1">
                                                <div className="flex items-center gap-2 rounded-xl bg-surface-5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:bg-surface-8 group-hover:text-text-300 border border-surface-10 transition-all">
                                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    {formatTime(item.due_at)}
                                                </div>
                                                <button
                                                    onClick={() => setEditingTaskId(item.task_id)}
                                                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-5 text-text-muted/30 transition-all hover:bg-surface-10 hover:text-text-base active:scale-90 border border-transparent hover:border-surface-15 cursor-pointer"
                                                >
                                                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.121a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                                        Project
                                    </span>
                                </div>
                                <h1 className="mt-1 truncate text-4xl font-bold tracking-tight text-text-base lg:text-5xl" title={currentProject?.name ?? "Project"}>
                                    {currentProject?.name ?? "Project"}
                                </h1>
                                {currentProject?.description && (
                                    <p className="mt-3 line-clamp-2 text-lg text-text-muted max-w-2xl animate-in slide-in-from-top-2 duration-500" title={currentProject.description}>
                                        {currentProject.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-none items-center gap-3 md:mt-1">
                                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-5 px-4 py-2 text-sm text-text-300 transition-all hover:bg-surface-10 active:scale-95">
                                    <input
                                        type="checkbox"
                                        checked={showCompletedProjectTasks}
                                        onChange={(e) => setShowCompletedProjectTasks(e.target.checked)}
                                        className="h-4 w-4 rounded border-surface-15 bg-transparent text-brand-500/70 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="select-none">{config.ui.showCompleted}</span>
                                </label>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-3 rounded-2xl bg-brand-500 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-on-brand shadow-brand-500/30 shadow-xl transition-all hover:scale-[1.02] hover:bg-brand-600 active:scale-[0.98] cursor-pointer animate-in fade-in zoom-in duration-500"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    Create Task
                                </button>
                                <button
                                    onClick={() => setShowTagsModal(true)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-5 text-text-muted transition-all hover:bg-surface-10 hover:text-text-base active:scale-95 cursor-pointer"
                                    title="Manage Tags"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                </button>
                            </div>
                        </div>

                        {tasksLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 animate-pulse rounded-3xl bg-surface-3" />
                                ))}
                            </div>
                        )}

                        {tasksError && (
                            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
                                <p className="text-red-400 font-medium">{tasksError}</p>
                            </div>
                        )}

                        {!tasksLoading && !tasksError && filteredTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-5xl border border-dashed border-surface-10 bg-surface-3 py-24 text-center">
                                <h3 className="text-xl font-semibold text-text-200">{config.ui.noTasksFound}</h3>
                                <p className="mt-2 text-text-muted">{config.ui.projectEmptyStateText}</p>
                            </div>
                        )}

                        {!tasksLoading && !tasksError && filteredTasks.length > 0 && (
                            <div className="space-y-4">
                                {[...filteredTasks]
                                    .sort((a, b) => {
                                        const aDue = a.due_at ? new Date(a.due_at).getTime() : Infinity;
                                        const bDue = b.due_at ? new Date(b.due_at).getTime() : Infinity;
                                        return aDue - bDue;
                                    })
                                    .map((task) => {
                                        const key = `project-task-${task.id}`;
                                        const isCompleting = completingKeys.has(key);
                                        const isVanishing = removingKeys.has(key);
                                        const isRecurring = task.repeat_every != null;
                                        const completed = isTaskCompleted(task);
                                        const isExpanded = expandedRecurring.has(task.id);
                                        const showCompletedVisuals = completed || isVanishing;

                                        return (
                                            <div key={task.id} className={`space-y-3 ${isVanishing ? "animate-vanish" : ""}`}>
                                                <div className={`group relative flex items-center gap-6 rounded-3xl border border-surface-5 bg-surface-3 p-5 transition-all hover:bg-surface-5 hover:border-surface-10 ${showCompletedVisuals ? "opacity-40 grayscale-[0.5]" : ""}`}>
                                                    <div className="flex-shrink-0">
                                                        {isRecurring ? (
                                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-5 border border-surface-10 text-brand-500/70">
                                                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleToggleProjectTask(task)}
                                                                disabled={isCompleting}
                                                                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 ${
                                                                    isCompleting
                                                                        ? "border-brand-500/50 animate-wiggle"
                                                                        : showCompletedVisuals
                                                                            ? "border-brand-500 bg-brand-500/10 text-brand-500"
                                                                            : "border-surface-10 text-transparent hover:border-brand-500/40 hover:text-brand-500/40"
                                                                }`}
                                                            >
                                                                <svg className={`h-6 w-6 ${(showCompletedVisuals && !isCompleting) ? "animate-pop" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-opacity duration-300 ${isRecurring ? "text-brand-500/70" : "text-brand-500/40 opacity-0 group-hover:opacity-100"}`}>
                                                                {isRecurring ? "Recurring Template" : "Single Task"}
                                                            </span>
                                                            {isRecurring && task.repeat_every && (
                                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                                                    Every {task.repeat_every} {task.repeat_unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className={`mt-1.5 truncate text-base font-medium tracking-tight transition-all ${completed ? "text-text-muted line-through" : "text-text-base group-hover:text-brand-600"}`}>
                                                            {task.title}
                                                        </h3>
                                                        <TaskTags tags={tagsByTaskId[task.id]} />
                                                        {task.description && (
                                                            <p className={`mt-1 text-sm leading-relaxed transition-all ${completed ? "text-text-muted/60 line-through" : "text-text-muted group-hover:text-text-300"}`}>
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        <p className="mt-2 text-sm text-text-muted">
                                                            {formatDue(task.due_at ?? undefined)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {isRecurring && (
                                                            <button
                                                                onClick={() => toggleRecurringExpansion(task)}
                                                                className={`flex items-center gap-2 rounded-xl bg-surface-5 px-4 py-2 text-xs font-bold text-text-300 transition-all hover:bg-surface-10 hover:text-text-base ${isExpanded ? "bg-surface-10 text-text-base ring-1 ring-surface-10" : ""}`}
                                                            >
                                                                Occurrences
                                                                <svg className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setEditingTaskId(task.id)}
                                                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-5 text-text-muted/30 transition-all hover:bg-surface-10 hover:text-text-base active:scale-90"
                                                        >
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {isRecurring && isExpanded && (
                                                    <div className="ml-12 border-l-2 border-surface-5 pl-8 py-2 animate-in slide-in-from-top-4 fade-in duration-500">
                                                        <OccurrenceList
                                                            taskId={task.id}
                                                            description={task.description}
                                                            state={taskOccurrences[task.id]}
                                                            completingKeys={completingKeys}
                                                            onToggle={handleToggleOccurrence}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {editingTaskId && (
                <TaskEditModal
                    taskId={editingTaskId}
                    onClose={() => setEditingTaskId(null)}
                    onUpdated={(updatedTask) => {
                        void refreshAgendaAndTasks();
                        if (updatedTask) {
                            void loadTagsForTasks([updatedTask.id], true);
                        }
                    }}
                    onDeleted={refreshAgendaAndTasks}
                />
            )}

            {showCreateModal && selectedProjectId && (
                <TaskCreateModal
                    projectId={selectedProjectId}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(newTask) => {
                        void refreshAgendaAndTasks();
                        if (newTask) {
                            void loadTagsForTasks([newTask.id], true);
                        }
                    }}
                />
            )}

            {editingProjectId && (
                <ProjectEditModal
                    projectId={editingProjectId}
                    onClose={() => setEditingProjectId(null)}
                    onUpdated={loadProjects}
                    onDeleted={() => {
                        loadProjects();
                        if (selectedProjectId === editingProjectId) nav("/");
                    }}
                />
            )}

            {showProjectCreateModal && (
                <ProjectCreateModal
                    onClose={() => setShowProjectCreateModal(false)}
                    onCreated={loadProjects}
                />
            )}

            {showTagsModal && (
                <TagsManagementModal
                    onClose={() => setShowTagsModal(false)}
                    onTagsUpdated={() => {
                        if (selectedProjectId) {
                            void loadTasks();
                        } else {
                            void loadAgenda();
                        }
                    }}
                />
            )}
        </div>
    );
}

function OccurrenceList({
    taskId,
    description,
    state,
    completingKeys,
    onToggle,
}: {
    taskId: number;
    description?: string | null;
    state?: { loading: boolean; error: string | null; items: components["schemas"]["Occurrence"][] };
    completingKeys: Set<string>;
    onToggle: (taskId: number, occurrence: components["schemas"]["Occurrence"]) => Promise<void>;
}) {
    const items = useMemo(() => [...(state?.items ?? [])].sort(
        (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    ), [state?.items]);

    if (state?.loading && items.length === 0) {
        return (
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-3" />
                ))}
            </div>
        );
    }

    if (state?.error) {
        return (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium">
                {state.error}
            </div>
        );
    }

    if (!state?.loading && items.length === 0) {
        return (
            <div className="py-4 text-sm text-text-muted italic">
                No occurrences found for this template.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((occurrence) => {
                const isCompleting = completingKeys.has(`occ-list-${taskId}-${occurrence.id}`);
                const completed = Boolean(occurrence.completed_at);

                return (
                    <div
                        key={occurrence.id}
                        className={`group flex items-center justify-between gap-4 rounded-2xl border border-surface-5 bg-surface-3 p-4 transition-all hover:bg-surface-5 ${completed ? "opacity-50" : ""}`}
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onToggle(taskId, occurrence)}
                                disabled={isCompleting}
                                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 ${
                                    isCompleting
                                        ? "border-brand-500/50 animate-wiggle"
                                        : completed
                                            ? "border-brand-500 bg-brand-500/10 text-brand-500"
                                            : "border-surface-10 text-transparent hover:border-brand-500/40 hover:text-brand-500/40"
                                }`}
                            >
                                <svg className={`h-5 w-5 ${(completed && !isCompleting) ? "animate-pop" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <div>
                                <p className={`text-base font-medium ${completed ? "text-text-muted line-through" : "text-text-200"}`}>
                                    {formatDue(occurrence.due_at)}
                                </p>
                                {description && (
                                    <p className={`mt-0.5 text-sm transition-all ${completed ? "text-text-muted/60 line-through" : "text-text-muted"}`}>
                                        {description}
                                    </p>
                                )}
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                                    Occurrence #{occurrence.id}
                                </p>
                            </div>
                        </div>
                        {completed && (
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-500/60">
                                Completed
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
