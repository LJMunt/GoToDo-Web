import { useEffect, useState } from "react";
import { listTags, updateTag, deleteTag, createTag } from "../api/tags";
import type { components } from "../api/schema";
import { useConfig } from "../features/config/ConfigContext";

type Tag = components["schemas"]["Tag"];

const allowedColors = [
    "slate", "gray", "red", "orange", "amber", "yellow", "lime", "green",
    "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "pink"
] as const;

type Color = typeof allowedColors[number];

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

const tagBgClasses: Record<string, string> = {
    slate: "bg-slate-500",
    gray: "bg-gray-500",
    red: "bg-red-500",
    orange: "bg-brand-500",
    amber: "bg-amber-500",
    yellow: "bg-yellow-500",
    lime: "bg-lime-500",
    green: "bg-green-500",
    emerald: "bg-emerald-500",
    teal: "bg-teal-500",
    cyan: "bg-cyan-500",
    sky: "bg-sky-500",
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
};

export function TagsManagementModal({
    onClose,
    onTagsUpdated,
}: {
    onClose: () => void;
    onTagsUpdated: () => void;
}) {
    const { config } = useConfig();
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingTagId, setEditingTagId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState<Color>("slate");
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await listTags();
                setTags(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : config.ui.errorPrefix);
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    async function handleUpdate(tagId: number) {
        if (!editName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const updated = await updateTag(tagId, { name: editName.trim(), color: editColor });
            setTags(tags.map(t => t.id === tagId ? updated : t));
            setEditingTagId(null);
            onTagsUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update tag");
        } finally {
            setSaving(false);
        }
    }

    async function handleCreate() {
        const name = newName.trim();
        if (!name) return;
        setSaving(true);
        setError(null);
        try {
            const tag = await createTag({ name });
            setTags([...tags, tag]);
            setNewName("");
            onTagsUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create tag");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(tagId: number) {
        if (!window.confirm("Are you sure you want to delete this tag? This will remove it from all tasks.")) return;
        setSaving(true);
        setError(null);
        try {
            await deleteTag(tagId);
            setTags(tags.filter(t => t.id !== tagId));
            onTagsUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete tag");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-surface-15">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-text-base tracking-tight">{config.ui.manageTagsTitle}</h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-2 ml-0.5">
                                {config.ui.manageTagsSubtitle}
                            </p>
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

                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
                            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-text-muted animate-pulse">{config.ui.loadingTags}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex gap-3">
                                <input
                                    className="flex-1 rounded-2xl border border-surface-10 bg-surface-3 px-4 py-4 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 font-medium placeholder:text-text-muted/40"
                                    placeholder={config.ui.createNewTagPlaceholder}
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={saving || !newName.trim()}
                                    className="rounded-2xl bg-brand-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-on-brand hover:bg-brand-600 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/20"
                                >
                                    {config.ui.createButton}
                                </button>
                            </div>

                            <div className="max-h-[40vh] overflow-y-auto pr-3 space-y-3 custom-scrollbar">
                                {tags.length === 0 ? (
                                    <div className="text-center py-12 rounded-3xl border border-dashed border-surface-10 bg-surface-3">
                                        <p className="text-sm font-medium text-text-muted">{config.ui.noTagsYet}</p>
                                    </div>
                                ) : (
                                    tags.map(tag => (
                                        <div key={tag.id} className="flex flex-col gap-4 rounded-3xl border border-surface-8 bg-surface-3 p-5 transition-all hover:bg-surface-5 group ring-1 ring-surface-10 shadow-sm">
                                            {editingTagId === tag.id ? (
                                                <div className="flex flex-col gap-5">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            autoFocus
                                                            className="flex-1 rounded-xl border border-surface-10 bg-surface-3 px-4 py-2.5 text-sm text-text-base outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 font-medium"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleUpdate(tag.id);
                                                                if (e.key === "Escape") setEditingTagId(null);
                                                            }}
                                                        />
                                                        <button
                                                            disabled={saving}
                                                            onClick={() => handleUpdate(tag.id)}
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-all border border-brand-500/20"
                                                        >
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTagId(null)}
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all border border-surface-10"
                                                        >
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2.5 px-1">
                                                        {allowedColors.map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => setEditColor(color)}
                                                                className={`h-7 w-7 rounded-xl border-2 transition-all ${editColor === color ? "border-white scale-110 shadow-lg ring-4 ring-white/10" : "border-transparent hover:scale-105 hover:rotate-6"} ${tagBgClasses[color]}`}
                                                                title={color}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-tight ring-1 ${tagColorClasses[tag.color] || tagColorClasses.slate}`}>
                                                            {tag.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTagId(tag.id);
                                                                setEditName(tag.name);
                                                                setEditColor(tag.color as Color);
                                                            }}
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-5 text-text-muted hover:text-text-base hover:bg-surface-10 border border-surface-10 transition-all"
                                                            title={config.ui.editTagTitle}
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tag.id)}
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/5 text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-red-500/10 transition-all"
                                                            title={config.ui.deleteTagTitle}
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-surface-3 p-10 border-t border-surface-5 flex flex-wrap justify-end gap-6">
                    <button
                        onClick={onClose}
                        className="rounded-2xl bg-surface-5 px-10 py-4 text-sm font-black uppercase tracking-widest text-text-muted hover:bg-surface-8 hover:text-text-base transition-all border border-surface-10 shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
