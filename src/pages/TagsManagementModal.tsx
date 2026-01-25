import { useEffect, useState } from "react";
import { listTags, updateTag, deleteTag, createTag } from "../api/tags";
import type { components } from "../api/schema";

type Tag = components["schemas"]["Tag"];

export function TagsManagementModal({
    onClose,
    onTagsUpdated,
}: {
    onClose: () => void;
    onTagsUpdated: () => void;
}) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingTagId, setEditingTagId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await listTags();
                setTags(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load tags");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    async function handleRename(tagId: number) {
        if (!editName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await updateTag(tagId, { name: editName.trim() });
            setTags(tags.map(t => t.id === tagId ? { ...t, name: editName.trim() } : t));
            setEditingTagId(null);
            onTagsUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to rename tag");
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
            <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-white/10 bg-[#121212] shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Manage Tags</h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                                Create, rename or delete your tags
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

                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                            <p className="mt-4 text-sm text-slate-500">Loading tags...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-white outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                    placeholder="Create new tag..."
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={saving || !newName.trim()}
                                    className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-orange-50 transition-all disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>

                            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {tags.length === 0 ? (
                                    <p className="text-center py-8 text-slate-500 text-sm italic">No tags created yet.</p>
                                ) : (
                                    tags.map(tag => (
                                        <div key={tag.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/2 p-4 transition-all hover:bg-white/4 group">
                                            {editingTagId === tag.id ? (
                                                <div className="flex flex-1 items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        className="flex-1 rounded-xl border border-white/10 bg-white/3 px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleRename(tag.id);
                                                            if (e.key === "Escape") setEditingTagId(null);
                                                        }}
                                                    />
                                                    <button
                                                        disabled={saving}
                                                        onClick={() => handleRename(tag.id)}
                                                        className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingTagId(null)}
                                                        className="p-1.5 text-slate-500 hover:bg-white/10 rounded-lg transition-colors"
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-orange-500/40" />
                                                        <span className="font-medium text-slate-200">{tag.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTagId(tag.id);
                                                                setEditName(tag.name);
                                                            }}
                                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                                            title="Rename tag"
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tag.id)}
                                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
                                                            title="Delete tag"
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white/2 p-8 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-2xl bg-white/5 px-8 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
