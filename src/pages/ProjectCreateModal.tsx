import { useState } from "react";
import { createProject } from "../api/projects";

export function ProjectCreateModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!name.trim()) {
            setError("Project name is required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await createProject({
                name,
                description: description || null,
            });
            onCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create project");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-lg overflow-hidden rounded-5xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-text-base">Create New Project</h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-1">
                                Start something new
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-5 text-text-muted hover:bg-surface-10 hover:text-text-base transition-all"
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
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Project Name</label>
                            <input
                                className="w-full rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Project name"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Description</label>
                            <textarea
                                className="w-full h-32 rounded-2xl border border-surface-10 bg-surface-3 px-4 py-3 text-text-base outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this project about?"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end bg-surface-3 p-8 border-t border-surface-5 gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-2xl px-6 py-3 text-sm font-bold text-text-muted hover:bg-surface-5 hover:text-text-base transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl bg-brand-500 px-8 py-3 text-sm font-bold text-on-brand shadow-lg shadow-brand-500/10 hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : "Create Project"}
                    </button>
                </div>
            </div>
        </div>
    );
}
