import { useEffect, useState } from "react";
import { deleteTask, getTask, getTaskTags, setTaskTags, updateTask } from "../api/tasks";
import { listTags } from "../api/tags";
import type { components } from "../api/schema";

type Task = components["schemas"]["Task"];
type Tag = components["schemas"]["Tag"];

export function TaskEditModal({
    taskId,
    onClose,
    onUpdated,
    onDeleted,
}: {
    taskId: number;
    onClose: () => void;
    onUpdated: () => void;
    onDeleted: () => void;
}) {
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
            await updateTask(taskId, {
                title,
                description: description || null,
                due_at: dueDate ? new Date(dueDate).toISOString() : null,
            });

            const tagNames = tags.filter(t => t.id === 0).map(t => t.name);
            const tagIds = tags.filter(t => t.id > 0).map(t => t.id);
            await setTaskTags(taskId, tagNames.length > 0 ? tagNames : undefined, tagIds);

            onUpdated();
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
            setError(err instanceof Error ? err.message : "Failed to delete task");
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
        setTags([...tags, { id: 0, user_id: 0, name, created_at: "" }]);
        setNewTag("");
    }

    function removeTag(tagName: string) {
        setTags(tags.filter(t => t.name !== tagName));
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-full max-w-lg rounded-4xl border border-white/10 bg-[#161616] p-8 text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                    <p className="mt-4 text-slate-400 font-medium">Loading task details...</p>
                </div>
            </div>
        );
    }

    if (!task) return null;

    const isRecurring = task.repeat_every != null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-white/10 bg-[#121212] shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Edit Task</h2>
                            {isRecurring && (
                                <p className="text-xs font-bold uppercase tracking-widest text-orange-500/70 mt-1">
                                    Recurring Template
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Title</label>
                            <input
                                className="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Description</label>
                            <textarea
                                className="w-full h-32 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description..."
                            />
                        </div>

                        {!isRecurring && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Due Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Tags</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map(tag => (
                                    <span key={tag.name} className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-500 ring-1 ring-orange-500/20">
                                        {tag.name}
                                        <button onClick={() => removeTag(tag.name)} className="hover:text-orange-400">
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 rounded-xl border border-white/10 bg-white/3 px-4 py-2 text-sm text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addTag(newTag)}
                                    placeholder="Add tag..."
                                    list="all-tags-list"
                                />
                                <datalist id="all-tags-list">
                                    {allTags.map(t => (
                                        <option key={t.id} value={t.name} />
                                    ))}
                                </datalist>
                                <button
                                    onClick={() => addTag(newTag)}
                                    className="rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-white/2 p-8 border-t border-white/5">
                    <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete Task
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-2xl px-6 py-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-bold text-black shadow-lg shadow-black/20 hover:bg-orange-50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
