import { useEffect, useState } from "react";
import {
    adminListLanguages,
    createLanguage,
    deleteLanguage,
    getConfigTranslations,
    getConfigValues,
    updateConfigTranslations,
    type AdminLanguage,
} from "../../api/admin";
import { useConfig } from "../../features/config/ConfigContext";

export default function LanguageManagement() {
    const { config: appConfig, refreshConfig } = useConfig();
    const [languages, setLanguages] = useState<AdminLanguage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await adminListLanguages();
            setLanguages(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch languages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError(null);
        try {
            // 1. Create the language
            await createLanguage({ code: newCode, name: newName });

            // 2. Seed translations from default language if needed
            const configValues = await getConfigValues();
            const defaultLang = (configValues["config.default_language"] as string) || "en";

            if (newCode !== defaultLang) {
                const defaultTranslations = await getConfigTranslations(defaultLang);
                // The issue description says: "Seed the translation fields with the default language ... if they are left empty."
                // When creating a new language, all fields are empty, so we seed everything.
                await updateConfigTranslations(newCode, defaultTranslations);
            }

            setNewCode("");
            setNewName("");
            await fetchData();
            await refreshConfig();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create language");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (code: string) => {
        if (!confirm(`Are you sure you want to delete language ${code}?`)) return;
        setError(null);
        try {
            await deleteLanguage(code);
            await fetchData();
            await refreshConfig();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete language");
        }
    };

    if (loading && languages.length === 0) {
        return <div className="p-8">{appConfig.ui.loading}</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-text-base">{appConfig.ui.language}</h1>
                <p className="text-text-muted font-medium">{appConfig.ui.languageDescription}</p>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <form onSubmit={handleCreate} className="p-8 rounded-4xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm space-y-6 sticky top-8">
                        <h2 className="text-lg font-bold text-text-base">Add New Language</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Language Code (e.g. en, pt-br)</label>
                                <input
                                    type="text"
                                    required
                                    pattern="^[a-z]{2}(-[a-z]{2})?$"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    className="w-full bg-surface-5 border border-surface-15 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all text-text-base placeholder:text-text-muted/20 font-medium"
                                    placeholder="en"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-surface-5 border border-surface-15 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all text-text-base placeholder:text-text-muted/20 font-medium"
                                    placeholder="English"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-on-brand font-black uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isCreating ? "Adding..." : "Add Language"}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-4xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-surface-10 bg-surface-5/50">
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Code</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Name</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-10">
                                {languages.map((lang) => (
                                    <tr key={lang.code} className="hover:bg-surface-5/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold text-text-base">{lang.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-text-base">{lang.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(lang.code)}
                                                className="p-2 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                                                title="Delete Language"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
