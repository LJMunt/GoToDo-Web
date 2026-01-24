import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAgenda } from "../api/agenda";
import { listProjectTasks, listProjects } from "../api/projects";
import { listTaskOccurrences, setOccurrenceCompletion, setTaskCompletion } from "../api/tasks";
import type { components } from "../api/schema";
import { useAuth } from "../features/auth/AuthContext";
import { TaskEditModal } from "./TaskEditModal";
import { TaskCreateModal } from "./TaskCreateModal";

type AgendaItem = components["schemas"]["AgendaItem"];
type Project = components["schemas"]["Project"];
type Task = components["schemas"]["Task"];

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
    const [expandedAgendaItems, setExpandedAgendaItems] = useState<Set<string>>(new Set());
    const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());
    const [showCompletedAgenda, setShowCompletedAgenda] = useState(false);
    const [showCompletedProjectTasks, setShowCompletedProjectTasks] = useState(false);
    const [completedAgendaHistory, setCompletedAgendaHistory] = useState<AgendaItem[]>([]);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [extraCompletedItems, setExtraCompletedItems] = useState<AgendaItem[]>([]);
    const [isLoadingExtra, setIsLoadingExtra] = useState(false);

    useEffect(() => {
        async function loadAgenda() {
            setAgendaLoading(true);
            setAgendaError(null);
            setAgendaItems([]);
            setCompletedAgendaHistory([]);
            try {
                const data = await getAgenda({ from: agendaDay.startISO, to: agendaDay.endISO });
                setAgendaItems(data);
            } catch (err) {
                setAgendaError(err instanceof Error ? err.message : "Failed to load agenda");
            } finally {
                setAgendaLoading(false);
            }
        }

        void loadAgenda();
    }, [agendaDay.endISO, agendaDay.startISO]);

    useEffect(() => {
        async function loadProjects() {
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
        }

        void loadProjects();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) return;

        async function loadTasks() {
            if (selectedProjectId === null) return;
            setTasksLoading(true);
            setTasksError(null);
            try {
                const data = await listProjectTasks(selectedProjectId);
                setTasks(data);
            } catch (err) {
                setTasksError(err instanceof Error ? err.message : "Failed to load tasks");
            } finally {
                setTasksLoading(false);
            }
        }

        void loadTasks();
    }, [selectedProjectId]);

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
                            } as any);
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
                        } as any);
                    }
                });
            });

            setExtraCompletedItems([...completedSingleTasks, ...completedOccurrences]);
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
                await setTaskCompletion(item.task_id, !completed);
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
            await setTaskCompletion(task.id, !completed);
            
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

    function toggleAgendaExpansion(key: string) {
        setExpandedAgendaItems((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-8">
                <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Navigation
                    </h2>
                    <div className="mt-4 space-y-1">
                        <button
                            onClick={() => nav("/")}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all relative group/nav ${
                                selectedProjectId === null
                                    ? "bg-white/8 text-white font-bold ring-1 ring-white/10"
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                            }`}
                        >
                            {selectedProjectId === null && (
                                <div className="absolute left-0 h-5 w-1 rounded-r-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                            )}
                            <svg className={`h-5 w-5 transition-colors ${selectedProjectId === null ? "text-orange-500" : "group-hover/nav:text-slate-300"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            <span className="text-sm">Today's Agenda</span>
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            Projects
                        </h2>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-white/10">
                            {projects.length}
                        </span>
                    </div>

                    <div className="mt-4 space-y-1">
                        {projectsLoading && (
                            <div className="space-y-3 px-4 py-2">
                                <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
                            </div>
                        )}

                        {projectsError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                                {projectsError}
                            </div>
                        )}

                        {!projectsLoading && !projectsError && projects.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 italic">
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
                                        className={`group flex w-full flex-col rounded-xl px-4 py-3 text-left transition-all ${
                                            isActive
                                                ? "bg-white/8 ring-1 ring-white/20"
                                                : "text-slate-400 hover:bg-white/4 hover:text-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${isActive ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-slate-700 group-hover:bg-slate-500"}`} />
                                            <span className={`text-sm font-semibold tracking-tight ${isActive ? "text-white" : ""}`}>
                                                {project.name}
                                            </span>
                                        </div>
                                        {project.description && (
                                            <p className="mt-1 ml-5 line-clamp-1 text-[11px] text-slate-500 group-hover:text-slate-400">
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
                                <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
                                    Your Agenda
                                </h1>
                                <div className="mt-2 flex items-center gap-2">
                                    <p className="text-slate-400">
                                        {agendaDay.label} • {filteredAgenda.length} items
                                    </p>
                                    {isLoadingExtra && (
                                        <svg className="h-3 w-3 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
                                        className="rounded-xl border border-white/10 bg-white/3 px-4 py-2 text-sm text-slate-200 outline-none transition-all group-hover:border-white/20 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAgendaDate(new Date())}
                                    className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                                >
                                    Today
                                </button>
                                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-300 transition-all hover:bg-white/10 active:scale-95">
                                    <input
                                        type="checkbox"
                                        checked={showCompletedAgenda}
                                        onChange={(e) => setShowCompletedAgenda(e.target.checked)}
                                        className="h-4 w-4 rounded border-white/20 bg-transparent text-orange-500/70 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="select-none">Show completed</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {agendaLoading && (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/3" />
                                    ))}
                                </div>
                            )}

                            {agendaError && (
                                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
                                    <p className="text-red-400 font-medium">{agendaError}</p>
                                </div>
                            )}

                            {!agendaLoading && !agendaError && filteredAgenda.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-5xl border border-dashed border-white/10 bg-white/1 py-24 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/3 text-slate-500">
                                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-slate-200">All caught up!</h3>
                                    <p className="mt-2 text-slate-500 max-w-xs mx-auto">Your agenda for today is empty. Time to relax or plan ahead.</p>
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
                                    const isExpanded = expandedAgendaItems.has(key);
                                    const showCompletedVisuals = completed || isVanishing;

                                    return (
                                        <div
                                            key={key}
                                            className={`group relative flex items-start gap-6 rounded-3xl border border-white/5 bg-white/2 p-5 transition-all hover:bg-white/4 hover:border-white/10 ${showCompletedVisuals ? "opacity-40 grayscale-[0.5]" : ""} ${isVanishing ? "animate-vanish" : ""}`}
                                        >
                                            <div className="relative flex-shrink-0 mt-1">
                                                <button
                                                    onClick={() => handleToggleAgenda(item)}
                                                    disabled={isCompleting}
                                                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 ${
                                                        isCompleting
                                                            ? "border-orange-500/50 animate-wiggle"
                                                            : showCompletedVisuals
                                                                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                                                : "border-white/10 text-transparent hover:border-orange-500/40 hover:text-orange-500/40"
                                                    }`}
                                                >
                                                    <svg className={`h-6 w-6 ${(showCompletedVisuals && !isCompleting) ? "animate-pop" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                </button>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-opacity duration-300 ${item.kind === "occurrence" ? "text-orange-500/70" : "text-blue-500/40 opacity-0 group-hover:opacity-100"}`}>
                                                        {item.kind === "occurrence" ? "Recurring" : "Task"}
                                                    </span>
                                                    <span className={`h-1 w-1 rounded-full bg-white/10 transition-opacity duration-300 ${item.kind === "task" ? "opacity-0 group-hover:opacity-100" : ""}`} />
                                                    <span className="truncate text-xs font-bold text-slate-500">
                                                        {projectName}
                                                    </span>
                                                </div>
                                                <h3 className={`mt-1.5 truncate text-base font-medium tracking-tight transition-all ${completed ? "text-slate-500 line-through" : "text-white group-hover:text-orange-50"}`}>
                                                    {item.title}
                                                </h3>
                                                {item.description && isExpanded && (
                                                    <p className={`mt-1.5 text-sm leading-relaxed animate-in slide-in-from-top-2 fade-in duration-300 transition-all ${completed ? "text-slate-600 line-through" : "text-slate-400 group-hover:text-slate-300"}`}>
                                                        {item.description}
                                                    </p>
                                                )}
                                                {item.description && (
                                                    <button
                                                        onClick={() => toggleAgendaExpansion(key)}
                                                        className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-orange-500 transition-colors cursor-pointer"
                                                    >
                                                        {isExpanded ? "Hide Description" : "View Description"}
                                                        <svg className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2 flex-shrink-0 mt-1">
                                                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-400 group-hover:bg-white/8 group-hover:text-slate-300">
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                    {formatTime(item.due_at)}
                                                </div>
                                                <button
                                                    onClick={() => setEditingTaskId(item.task_id)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-500/30 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                        Project
                                    </span>
                                </div>
                                <h1 className="mt-1 text-4xl font-bold tracking-tight text-white lg:text-5xl">
                                    {projectNameMap.get(selectedProjectId) ?? "Project"}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-300 transition-all hover:bg-white/10 active:scale-95">
                                    <input
                                        type="checkbox"
                                        checked={showCompletedProjectTasks}
                                        onChange={(e) => setShowCompletedProjectTasks(e.target.checked)}
                                        className="h-4 w-4 rounded border-white/20 bg-transparent text-orange-500/70 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="select-none">Show completed</span>
                                </label>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 rounded-xl bg-linear-to-br from-orange-400 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] active:scale-[0.98] cursor-pointer animate-in fade-in zoom-in duration-500"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    Create Task
                                </button>
                            </div>
                        </div>

                        {tasksLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/3" />
                                ))}
                            </div>
                        )}

                        {tasksError && (
                            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
                                <p className="text-red-400 font-medium">{tasksError}</p>
                            </div>
                        )}

                        {!tasksLoading && !tasksError && filteredTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-5xl border border-dashed border-white/10 bg-white/1 py-24 text-center">
                                <h3 className="text-xl font-semibold text-slate-200">No tasks found</h3>
                                <p className="mt-2 text-slate-500">This project is currently empty. Start by adding a task.</p>
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
                                                <div className={`group relative flex items-center gap-6 rounded-3xl border border-white/5 bg-white/2 p-5 transition-all hover:bg-white/4 hover:border-white/10 ${showCompletedVisuals ? "opacity-40 grayscale-[0.5]" : ""}`}>
                                                    <div className="flex-shrink-0">
                                                        {isRecurring ? (
                                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-orange-500/70">
                                                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleToggleProjectTask(task)}
                                                                disabled={isCompleting}
                                                                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 ${
                                                                    isCompleting
                                                                        ? "border-orange-500/50 animate-wiggle"
                                                                        : showCompletedVisuals
                                                                            ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                                                            : "border-white/10 text-transparent hover:border-orange-500/40 hover:text-orange-500/40"
                                                                }`}
                                                            >
                                                                <svg className={`h-6 w-6 ${(showCompletedVisuals && !isCompleting) ? "animate-pop" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-opacity duration-300 ${isRecurring ? "text-orange-500/70" : "text-blue-500/40 opacity-0 group-hover:opacity-100"}`}>
                                                                {isRecurring ? "Recurring Template" : "Single Task"}
                                                            </span>
                                                            {isRecurring && task.repeat_every && (
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                    Every {task.repeat_every} {task.repeat_unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className={`mt-1.5 truncate text-base font-medium tracking-tight transition-all ${completed ? "text-slate-500 line-through" : "text-white group-hover:text-orange-50"}`}>
                                                            {task.title}
                                                        </h3>
                                                        {task.description && (
                                                            <p className={`mt-1 text-sm leading-relaxed transition-all ${completed ? "text-slate-600 line-through" : "text-slate-400 group-hover:text-slate-300"}`}>
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        <p className="mt-2 text-sm text-slate-400">
                                                            {formatDue(task.due_at ?? undefined)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {isRecurring && (
                                                            <button
                                                                onClick={() => toggleRecurringExpansion(task)}
                                                                className={`flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white ${isExpanded ? "bg-white/10 text-white ring-1 ring-white/10" : ""}`}
                                                            >
                                                                Occurrences
                                                                <svg className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setEditingTaskId(task.id)}
                                                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-500/30 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                                                        >
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {isRecurring && isExpanded && (
                                                    <div className="ml-12 border-l-2 border-white/5 pl-8 py-2 animate-in slide-in-from-top-4 fade-in duration-500">
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
                    onUpdated={refreshAgendaAndTasks}
                    onDeleted={refreshAgendaAndTasks}
                />
            )}

            {showCreateModal && selectedProjectId && (
                <TaskCreateModal
                    projectId={selectedProjectId}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={refreshAgendaAndTasks}
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
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/3" />
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
            <div className="py-4 text-sm text-slate-500 italic">
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
                        className={`group flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/2 p-4 transition-all hover:bg-white/4 ${completed ? "opacity-50" : ""}`}
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onToggle(taskId, occurrence)}
                                disabled={isCompleting}
                                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90 ${
                                    isCompleting
                                        ? "border-orange-500/50 animate-wiggle"
                                        : completed
                                            ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                            : "border-white/10 text-transparent hover:border-orange-500/40 hover:text-orange-500/40"
                                }`}
                            >
                                <svg className={`h-5 w-5 ${(completed && !isCompleting) ? "animate-pop" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <div>
                                <p className={`text-base font-medium ${completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                    {formatDue(occurrence.due_at)}
                                </p>
                                {description && (
                                    <p className={`mt-0.5 text-sm transition-all ${completed ? "text-slate-600 line-through" : "text-slate-400"}`}>
                                        {description}
                                    </p>
                                )}
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    Occurrence #{occurrence.id}
                                </p>
                            </div>
                        </div>
                        {completed && (
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-500/60">
                                Completed
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
