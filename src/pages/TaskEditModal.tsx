import { useEffect, useState } from "react";
import { deleteTask, getTask, getTaskTags, setTaskTags, updateTask } from "../api/tasks";
import { createTag, listTags } from "../api/tags";
import type { components } from "../api/schema";
import { useConfig } from "../features/config/ConfigContext";

type Task = components["schemas"]["Task"];
type Tag = components["schemas"]["Tag"];

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

export function TaskEditModal({
    taskId,
    onClose,
    onUpdated,
    onDeleted,
}: {
    taskId: number;
    onClose: () => void;
    onUpdated: (task?: Task) => void;
    onDeleted: () => void;
}) {
    const { config } = useConfig();
    const [task, setTask] = useState<Task | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [newTag, setNewTag] = useState("");

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [taskData, taskTags, userTags] = await Promise.all([
                    getTask(taskId),
                    getTaskTags(taskId),
                    listTags(),
                ]);
                setTask(taskData);
                setTags(taskTags);
                setAllTags(userTags);

                setTitle(taskData.title);
                setDescription(taskData.description ?? "");
                if (taskData.due_at) {
                    const d = new Date(taskData.due_at);
                    const offset = d.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
                    setDueDate(localISOTime);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load task");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [taskId]);

    async function handleSave() {
        if (!task) return;
        setSaving(true);
        setError(null);
        try {
            // Create tags that don't exist yet
            const tagPromises = tags.map(async (t) => {
                if (t.id === 0) {
                    return await createTag({ name: t.name, color: t.color });
                }
                return t;
            });
            const finalTags = await Promise.all(tagPromises);
            const tagIds = finalTags.map(t => t.id);

            await updateTask(taskId, {
                title,
                description: description || null,
                due_at: dueDate ? new Date(dueDate).toISOString() : null,
                tag_ids: tagIds,
            });

            if (tagIds.length > 0) {
                await setTaskTags(taskId, tagIds);
            }

            const updatedTask = await getTask(taskId);
            onUpdated(updatedTask);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save task");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        setSaving(true);
        try {
            await deleteTask(taskId);
            onDeleted();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : config.ui.errorPrefix);
        } finally {
            setSaving(false);
        }
    }

    function addTag(tagName: string) {
        const name = tagName.trim();
        if (!name) return;
        if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            setNewTag("");
            return;
        }

        const existingTag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (existingTag) {
            setTags([...tags, existingTag]);
        } else {
            setTags([...tags, { id: 0, name, color: "slate", created_at: "", updated_at: "" }]);
        }
        setNewTag("");
    }

    function removeTag(tagName: string) {
        setTags(tags.filter(t => t.name !== tagName));
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-full max-w-lg rounded-4xl border border-surface-10 bg-bg-16 p-12 text-center shadow-2xl">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-on-brand shadow-brand-500/40 shadow-lg animate-wiggle mb-6">
                        <span className="text-2xl font-black italic">G</span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted animate-pulse">Loading task details...</p>
                </div>
            </div>
        );
    }

    if (!task) return null;

    const isRecurring = task.repeat_every != null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-surface-15">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-text-base tracking-tight">{config.ui.editTaskTitle}</h2>
                            {isRecurring && (
                                <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mt-2 ml-0.5">
                                    {config.ui.recurringTemplate}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all border border-surface-10"
                        >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.ui.taskTitleLabel}</label>
                            <input
                                className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-4 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 font-medium placeholder:text-text-muted/40"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={config.ui.taskTitlePlaceholder}
                            />
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.ui.taskDescriptionLabel}</label>
                            <textarea
                                className="w-full h-32 rounded-2xl border border-surface-10 bg-surface-3 px-4 py-4 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 resize-none font-medium placeholder:text-text-muted/40"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={config.ui.taskDescriptionPlaceholder}
                            />
                        </div>

                        {!isRecurring && (
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.ui.dueDateLabel}</label>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-4 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 font-medium"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">{config.ui.tagsLabel}</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map(tag => {
                                    const colorClass = tagColorClasses[tag.color] || tagColorClasses.slate;
                                    return (
                                        <span key={tag.name} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-tight ring-1 ${colorClass}`}>
                                            {tag.name}
                                            <button onClick={() => removeTag(tag.name)} className="hover:opacity-70 transition-opacity">
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-sm text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 font-medium placeholder:text-text-muted/40"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addTag(newTag);
                                        }
                                    }}
                                    placeholder={config.ui.addTagPlaceholder}
                                    list="all-tags-list"
                                />
                                <datalist id="all-tags-list">
                                    {allTags.map(t => (
                                        <option key={t.id} value={t.name} />
                                    ))}
                                </datalist>
                                <button
                                    onClick={() => addTag(newTag)}
                                    className="rounded-2xl bg-surface-5 px-6 py-3 text-sm font-bold text-text-300 hover:bg-surface-10 hover:text-text-base transition-all border border-surface-10"
                                >
                                    {config.ui.addButton}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-surface-3 p-10 border-t border-surface-5">
                    <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        {config.ui.deleteTaskButton}
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="rounded-2xl px-8 py-4 text-sm font-bold text-text-muted hover:bg-surface-8 hover:text-text-base transition-all"
                        >
                            {config.ui.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-brand-500 px-10 py-4 text-sm font-black uppercase tracking-widest text-on-brand shadow-xl shadow-brand-500/20 hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : config.ui.saveChangesButton}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
