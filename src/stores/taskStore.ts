import { create } from "zustand";
import { getAgenda } from "../api/agenda";
import { listProjectTasks, listProjects } from "../api/projects";
import { getTaskTags, listTaskOccurrences, setOccurrenceCompletion, setTaskCompletion } from "../api/tasks";
import type { components } from "../api/schema";

export type AgendaItem = components["schemas"]["AgendaItem"];
export type Project = components["schemas"]["Project"];
export type Task = components["schemas"]["Task"];
export type Tag = components["schemas"]["Tag"];

interface OccurrenceState {
    loading: boolean;
    error: string | null;
    items: components["schemas"]["Occurrence"][];
}

interface TaskStoreState {
    // Agenda
    agendaItems: AgendaItem[];
    agendaLoading: boolean;
    agendaError: string | null;

    // Projects
    projects: Project[];
    projectsLoading: boolean;
    projectsError: string | null;

    // Tasks in current project
    tasks: Task[];
    tasksLoading: boolean;
    tasksError: string | null;

    // Tags for tasks
    tagsByTaskId: Record<number, Tag[]>;

    // Recurring expansion + occurrences cache
    expandedRecurring: Set<number>;
    taskOccurrences: Record<number, OccurrenceState>;

    // UI flags
    showCompletedAgenda: boolean;
    showCompletedProjectTasks: boolean;

    // Completed items from outside agenda fetch (for show completed mode)
    extraCompletedItems: AgendaItem[];
    isLoadingExtra: boolean;

    // Actions
    setShowCompletedAgenda: (v: boolean) => void;
    setShowCompletedProjectTasks: (v: boolean) => void;

    setExpandedRecurring: (updater: (prev: Set<number>) => Set<number>) => void;

    loadAgenda: (fromISO: string, toISO: string) => Promise<void>;
    loadProjects: () => Promise<void>;
    loadTasks: (projectId: number) => Promise<void>;
    loadTagsForTasks: (taskIds: number[], force?: boolean) => Promise<void>;

    toggleAgendaCompletion: (item: AgendaItem, currentTags: Tag[]) => Promise<void>;
    toggleProjectTaskCompletion: (task: Task, currentTags: Tag[]) => Promise<void>;
    toggleOccurrenceCompletion: (taskId: number, occurrenceId: number, completed: boolean) => Promise<void>;

    fetchExtraCompletedItems: (projects: Project[], fromISO: string, toISO: string) => Promise<void>;
    loadOccurrences: (taskId: number) => Promise<void>;
    resetAgendaDerived: () => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
    agendaItems: [],
    agendaLoading: false,
    agendaError: null,

    projects: [],
    projectsLoading: false,
    projectsError: null,

    tasks: [],
    tasksLoading: false,
    tasksError: null,

    tagsByTaskId: {},

    expandedRecurring: new Set<number>(),
    taskOccurrences: {},

    showCompletedAgenda: false,
    showCompletedProjectTasks: false,

    extraCompletedItems: [],
    isLoadingExtra: false,

    setShowCompletedAgenda: (v: boolean) => set({ showCompletedAgenda: v }),
    setShowCompletedProjectTasks: (v: boolean) => set({ showCompletedProjectTasks: v }),

    setExpandedRecurring: (updater) => set((s) => ({ expandedRecurring: updater(new Set(s.expandedRecurring)) })),

    loadAgenda: async (fromISO: string, toISO: string) => {
        set({ agendaLoading: true, agendaError: null, agendaItems: [] });
        try {
            const data = await getAgenda({ from: fromISO, to: toISO });
            set({ agendaItems: data });
            void get().loadTagsForTasks(data.map((i) => i.task_id));
        } catch (err) {
            set({ agendaError: err instanceof Error ? err.message : "Failed to load agenda" });
        } finally {
            set({ agendaLoading: false });
        }
    },

    loadProjects: async () => {
        set({ projectsLoading: true, projectsError: null });
        try {
            const data = await listProjects();
            set({ projects: data });
        } catch (err) {
            set({ projectsError: err instanceof Error ? err.message : "Failed to load projects" });
        } finally {
            set({ projectsLoading: false });
        }
    },

    loadTasks: async (projectId: number) => {
        set({ tasksLoading: true, tasksError: null });
        try {
            const data = await listProjectTasks(projectId);
            set({ tasks: data });
            void get().loadTagsForTasks(data.map((t) => t.id));
        } catch (err) {
            set({ tasksError: err instanceof Error ? err.message : "Failed to load tasks" });
        } finally {
            set({ tasksLoading: false });
        }
    },

    loadTagsForTasks: async (taskIds: number[], force = false) => {
        const { tagsByTaskId } = get();
        const uniqueIds = [...new Set(taskIds)].filter((id) => force || !tagsByTaskId[id]);
        if (uniqueIds.length === 0) return;
        try {
            const results = await Promise.all(uniqueIds.map((id) => getTaskTags(id).then((tags) => ({ id, tags }))));
            set((s) => {
                const next = { ...s.tagsByTaskId } as Record<number, Tag[]>;
                results.forEach(({ id, tags }) => {
                    next[id] = tags;
                });
                return { tagsByTaskId: next };
            });
        } catch (err) {
            console.error("Failed to load task tags", err);
        }
    },

    toggleAgendaCompletion: async (item, currentTags) => {
        const completed = Boolean((item as any).completed_at) || Boolean((item as any).completed);
        if (item.kind === "occurrence" && item.occurrence_id != null) {
            await setOccurrenceCompletion(item.task_id, item.occurrence_id, !completed);
        } else {
            await setTaskCompletion(item.task_id, !completed, currentTags);
        }
    },

    toggleProjectTaskCompletion: async (task, currentTags) => {
        const completed = Boolean(task.completed_at) || Boolean((task as any).completed);
        if (task.repeat_every != null) return;
        await setTaskCompletion(task.id, !completed, currentTags);
    },

    toggleOccurrenceCompletion: async (taskId, occurrenceId, completed) => {
        await setOccurrenceCompletion(taskId, occurrenceId, !completed);
        set((s) => {
            const current = s.taskOccurrences[taskId];
            if (!current) return s;
            const updated = current.items.map((it) => (it.id === occurrenceId ? { ...it, completed_at: !completed ? new Date().toISOString() : null } : it));
            return { taskOccurrences: { ...s.taskOccurrences, [taskId]: { ...current, items: updated } } };
        });
    },

    fetchExtraCompletedItems: async (projects, fromISO, toISO) => {
        const dayStart = new Date(fromISO);
        const dayEnd = new Date(toISO);
        set({ isLoadingExtra: true });
        try {
            const tasksByProject = await Promise.all(projects.map((p) => listProjectTasks(p.id)));
            const completedSingles: AgendaItem[] = [];
            const recurringTemplates: { task: Task; projectId: number }[] = [];

            tasksByProject.forEach((pTasks, idx) => {
                const pId = projects[idx].id;
                pTasks.forEach((t) => {
                    if (t.repeat_every != null) {
                        recurringTemplates.push({ task: t, projectId: pId });
                    } else if (t.completed_at && t.due_at) {
                        const due = new Date(t.due_at);
                        if (due >= dayStart && due <= dayEnd) {
                            completedSingles.push({
                                kind: "task",
                                task_id: t.id,
                                project_id: pId,
                                title: t.title,
                                description: t.description,
                                due_at: t.due_at,
                                completed_at: t.completed_at,
                            } as AgendaItem);
                        }
                    }
                });
            });

            const occResults = await Promise.all(
                recurringTemplates.map((rt) =>
                    listTaskOccurrences(rt.task.id, { from: fromISO, to: toISO })
                        .then((occs) => ({ rt, occs }))
                        .catch(() => ({ rt, occs: [] }))
                )
            );

            const completedOccurrences: AgendaItem[] = [];
            occResults.forEach(({ rt, occs }) => {
                occs.forEach((occ) => {
                    if (occ.completed_at) {
                        completedOccurrences.push({
                            kind: "occurrence",
                            task_id: rt.task.id,
                            occurrence_id: occ.id,
                            project_id: rt.projectId,
                            title: rt.task.title,
                            description: rt.task.description,
                            due_at: occ.due_at,
                            completed_at: occ.completed_at,
                        } as AgendaItem);
                    }
                });
            });

            set({ extraCompletedItems: [...completedSingles, ...completedOccurrences] });
            void get().loadTagsForTasks([...completedSingles, ...completedOccurrences].map((i) => i.task_id));
        } catch (err) {
            console.error("Failed to fetch extra completed items", err);
        } finally {
            set({ isLoadingExtra: false });
        }
    },

    loadOccurrences: async (taskId: number) => {
        set((s) => ({
            taskOccurrences: {
                ...s.taskOccurrences,
                [taskId]: { loading: true, error: null, items: s.taskOccurrences[taskId]?.items ?? [] },
            },
        }));
        try {
            const items = await listTaskOccurrences(taskId);
            set((s) => ({
                taskOccurrences: {
                    ...s.taskOccurrences,
                    [taskId]: { loading: false, error: null, items },
                },
            }));
        } catch (err) {
            set((s) => ({
                taskOccurrences: {
                    ...s.taskOccurrences,
                    [taskId]: {
                        loading: false,
                        error: err instanceof Error ? err.message : "Failed to load occurrences",
                        items: s.taskOccurrences[taskId]?.items ?? [],
                    },
                },
            }));
        }
    },

    resetAgendaDerived: () => set({ extraCompletedItems: [] }),
}));
