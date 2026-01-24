import { useEffect, useState } from "react";
import { createTask } from "../api/projects";
import { setTaskTags } from "../api/tasks";
import { listTags } from "../api/tags";
import type { components } from "../api/schema";

type Tag = components["schemas"]["Tag"];

export function TaskCreateModal({
    projectId,
    onClose,
    onCreated,
}: {
    projectId: number;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [newTag, setNewTag] = useState("");

    const [isRecurring, setIsRecurring] = useState(false);
    const [repeatEvery, setRepeatEvery] = useState(1);
    const [repeatUnit, setRepeatUnit] = useState<"day" | "week" | "month">("day");

    useEffect(() => {
        async function loadTags() {
            try {
                const userTags = await listTags();
                setAllTags(userTags);
            } catch (err) {
                console.error("Failed to load tags", err);
            }
        }
        void loadTags();
    }, []);

    async function handleSave() {
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        if (isRecurring && !dueDate) {
            setError("Due date is required for recurring tasks");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const task = await createTask(projectId, {
                title,
                description: description || null,
                due_at: dueDate ? new Date(dueDate).toISOString() : null,
                repeat_every: isRecurring ? repeatEvery : null,
                repeat_unit: isRecurring ? repeatUnit : null,
            });

            if (tags.length > 0) {
                const tagNames = tags.filter(t => t.id === 0).map(t => t.name);
                const tagIds = tags.filter(t => t.id > 0).map(t => t.id);
                await setTaskTags(task.id, tagNames.length > 0 ? tagNames : undefined, tagIds);
            }

            onCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create task");
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
        // Try to find if tag exists in allTags
        const existing = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            setTags([...tags, existing]);
        } else {
            setTags([...tags, { id: 0, user_id: 0, name, created_at: "" }]);
        }
        setNewTag("");
    }

    function removeTag(tagName: string) {
        setTags(tags.filter(t => t.name !== tagName));
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Create New Task</h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                                Adding to project
                            </p>
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
                                autoFocus
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

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Due Date</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

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
                                    list="create-tags-list"
                                />
                                <datalist id="create-tags-list">
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

                        {/* Recurring Task Section */}
                        {isRecurring && (
                            <div className="pt-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-500 fade-in">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Repeat Every</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                                value={repeatEvery}
                                                onChange={(e) => setRepeatEvery(Math.max(1, parseInt(e.target.value) || 1))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Frequency</label>
                                        <div className="relative">
                                            <select
                                                className="w-full rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
                                                value={repeatUnit}
                                                onChange={(e) => setRepeatUnit(e.target.value as any)}
                                            >
                                                <option value="day">Day(s)</option>
                                                <option value="week">Week(s)</option>
                                                <option value="month">Month(s)</option>
                                            </select>
                                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between bg-white/2 p-8 border-t border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-lg border-2 transition-all ${isRecurring ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-white/10 group-hover:border-white/30"}`}>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                            />
                            {isRecurring && <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className={`text-sm font-bold transition-colors ${isRecurring ? "text-orange-500/80" : "text-slate-500 group-hover:text-slate-400"}`}>
                            Recurring Task
                        </span>
                    </label>

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
                            ) : "Create Task"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
