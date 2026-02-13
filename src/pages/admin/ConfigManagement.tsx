import { useEffect, useState, useMemo } from "react";
import {
    listConfigKeys,
    getConfigTranslations,
    updateConfigTranslations,
    getConfigValues,
    updateConfigValues,
    createLanguage,
    deleteLanguage
} from "../../api/admin";
import type { ConfigKey, ConfigTranslations, ConfigValues, ConfigValue } from "../../features/config/types";
import { useConfig } from "../../features/config/ConfigContext";

export default function ConfigManagement() {
    const { config: appConfig, refreshConfig, availableLanguages: LANGUAGES, fetchLanguages } = useConfig();
    const [scope, setScope] = useState<"ui" | "backend">("ui");
    const [keys, setKeys] = useState<ConfigKey[]>([]);
    const [currentLang, setCurrentLang] = useState("en");

    // Language management state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    
    // UI Text state
    const [translations, setTranslations] = useState<ConfigTranslations>({});
    const [editedTranslations, setEditedTranslations] = useState<ConfigTranslations>({});
    
    // Backend values state
    const [values, setValues] = useState<ConfigValues>({});
    const [editedValues, setEditedValues] = useState<ConfigValues>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [keysData, translationsData, valuesData] = await Promise.all([
                    listConfigKeys(),
                    getConfigTranslations(currentLang),
                    getConfigValues()
                ]);
                setKeys(keysData);
                setTranslations(translationsData);
                setEditedTranslations(translationsData);
                setValues(valuesData);
                setEditedValues(valuesData);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch configuration data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentLang]);

    const hasChanges = useMemo(() => {
        if (scope === "ui") {
            return JSON.stringify(translations) !== JSON.stringify(editedTranslations);
        } else {
            return JSON.stringify(values) !== JSON.stringify(editedValues);
        }
    }, [scope, translations, editedTranslations, values, editedValues]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            if (scope === "ui") {
                await updateConfigTranslations(currentLang, editedTranslations);
                setTranslations(editedTranslations);
            } else {
                await updateConfigValues(editedValues);
                setValues(editedValues);
            }
            // Refresh public config
            await refreshConfig();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (scope === "ui") {
            setEditedTranslations(translations);
        } else {
            setEditedValues(values);
        }
    };

    const handleCreateLanguage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError(null);
        try {
            const normalizedCode = newCode.toLowerCase();
            await createLanguage({ code: normalizedCode, name: newName });
            const configValues = await getConfigValues();
            const defaultLang = (configValues["config.default_language"] as string) || "en";

            if (normalizedCode !== defaultLang) {
                const defaultTranslations = await getConfigTranslations(defaultLang);
                await updateConfigTranslations(normalizedCode, defaultTranslations);
            }

            setNewCode("");
            setNewName("");
            setShowCreateModal(false);
            await fetchLanguages();
            await refreshConfig();
            setCurrentLang(normalizedCode);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create language");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteLanguage = async (code: string) => {
        if (!confirm(`Are you sure you want to delete language ${code}?`)) return;
        setError(null);
        try {
            await deleteLanguage(code);
            await fetchLanguages();
            await refreshConfig();
            if (currentLang === code) {
                setCurrentLang("en");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete language");
        }
    };

    const filteredKeys = keys.filter(k => {
        const matchesSearch = k.key.toLowerCase().includes(search.toLowerCase()) || 
            k.description?.toLowerCase().includes(search.toLowerCase());
        const matchesScope = scope === "ui" ? k.is_public : !k.is_public;
        return matchesSearch && matchesScope;
    });

    const groupedKeys = useMemo(() => {
        const groups: Record<string, ConfigKey[]> = {};
        filteredKeys.forEach(k => {
            const group = k.key.split(".")[0];
            if (!groups[group]) groups[group] = [];
            groups[group].push(k);
        });
        return groups;
    }, [filteredKeys]);

    if (loading && keys.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                    <p className="text-sm text-text-muted">Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-base transition-none!">{appConfig.navigation.configuration}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-surface-5 p-1 rounded-xl border border-surface-10 mr-4">
                        <button
                            onClick={() => setScope("ui")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                scope === "ui"
                                    ? "bg-surface-3 text-brand-500 shadow-sm ring-1 ring-surface-10"
                                    : "text-text-muted hover:text-text-base"
                            }`}
                        >
                            UI Text
                        </button>
                        <button
                            onClick={() => setScope("backend")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                scope === "backend"
                                    ? "bg-surface-3 text-brand-500 shadow-sm ring-1 ring-surface-10"
                                    : "text-text-muted hover:text-text-base"
                            }`}
                        >
                            Backend Settings
                        </button>
                    </div>
                    {hasChanges && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleReset}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-base transition-colors"
                            >
                                {appConfig.ui.reset}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        {appConfig.ui.saving}
                                    </>
                                ) : appConfig.ui.saveChanges}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{error}</p>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search settings..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-surface-3 border border-surface-10 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="space-y-8">
                        {Object.entries(groupedKeys).map(([group, groupKeys]) => (
                            <div key={group} className="space-y-4">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">{group}</h3>
                                <div className="grid gap-4">
                                    {groupKeys.map((k) => (
                                        <div key={k.key} className="p-6 rounded-3xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-bold text-text-base">{k.key}</span>
                                                        {k.is_public ? (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-md border border-green-500/20">
                                                                Public
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                                                                Private
                                                            </span>
                                                        )}
                                                    </div>
                                                    {k.description && <p className="text-xs text-text-muted mt-1">{k.description}</p>}
                                                </div>
                                                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-surface-5 px-2 py-1 rounded-lg border border-surface-10">
                                                    {k.data_type}
                                                </div>
                                            </div>

                                            <div className="relative group/input">
                                                {scope === "ui" ? (
                                                    <input
                                                        type="text"
                                                        value={editedTranslations[k.key] ?? ""}
                                                        onChange={(e) => setEditedTranslations({
                                                            ...editedTranslations,
                                                            [k.key]: e.target.value
                                                        })}
                                                        className="w-full bg-surface-5 border border-surface-10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all"
                                                        placeholder="Enter translation..."
                                                    />
                                                ) : (
                                                    k.data_type === "boolean" ? (
                                                        <div className="flex items-center gap-4 py-1">
                                                            <button
                                                                onClick={() => setEditedValues({
                                                                    ...editedValues,
                                                                    [k.key]: true
                                                                })}
                                                                className={`flex-1 py-2 px-4 rounded-xl border text-sm font-medium transition-all ${
                                                                    editedValues[k.key] === true
                                                                        ? "bg-brand-500/10 border-brand-500 text-brand-500"
                                                                        : "bg-surface-5 border-surface-10 text-text-muted hover:border-surface-20"
                                                                }`}
                                                            >
                                                                True
                                                            </button>
                                                            <button
                                                                onClick={() => setEditedValues({
                                                                    ...editedValues,
                                                                    [k.key]: false
                                                                })}
                                                                className={`flex-1 py-2 px-4 rounded-xl border text-sm font-medium transition-all ${
                                                                    editedValues[k.key] === false
                                                                        ? "bg-brand-500/10 border-brand-500 text-brand-500"
                                                                        : "bg-surface-5 border-surface-10 text-text-muted hover:border-surface-20"
                                                                }`}
                                                            >
                                                                False
                                                            </button>
                                                        </div>
                                                    ) : k.data_type === 'string' ? (
                                                        <input
                                                            type="text"
                                                            value={String(editedValues[k.key] ?? "")}
                                                            onChange={(e) => setEditedValues({
                                                                ...editedValues,
                                                                [k.key]: e.target.value
                                                            })}
                                                            className="w-full bg-surface-5 border border-surface-10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all"
                                                            placeholder="Enter string value..."
                                                        />
                                                    ) : (
                                                        <input
                                                            type={k.data_type === 'number' ? 'number' : 'text'}
                                                            value={(() => {
                                                                const current = editedValues[k.key];
                                                                if (current == null) return "";
                                                                if (typeof current === "object") return JSON.stringify(current);
                                                                return String(current);
                                                            })()}
                                                            onChange={(e) => {
                                                                const raw = e.target.value;
                                                                let val: ConfigValue;
                                                                if (k.data_type === 'number') {
                                                                    val = raw === "" ? 0 : Number(raw);
                                                                } else {
                                                                    if (raw.trim() === "") {
                                                                        val = null;
                                                                    } else {
                                                                        try {
                                                                            const parsed = JSON.parse(raw);
                                                                            if (Array.isArray(parsed)) {
                                                                                val = parsed as unknown[];
                                                                            } else if (parsed !== null && typeof parsed === "object") {
                                                                                val = parsed as Record<string, never>;
                                                                            } else if (typeof parsed === "number" || typeof parsed === "boolean") {
                                                                                val = parsed as number | boolean;
                                                                            } else {
                                                                                val = raw; // Fallback to raw string if it's not valid JSON but might be intended as string
                                                                            }
                                                                        } catch {
                                                                            // If not valid JSON, treat as string
                                                                            val = raw;
                                                                        }
                                                                    }
                                                                }
                                                                setEditedValues({
                                                                    ...editedValues,
                                                                    [k.key]: val
                                                                });
                                                            }}
                                                            className="w-full bg-surface-5 border border-surface-10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all"
                                                            placeholder={`Enter ${k.data_type} value...`}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredKeys.length === 0 && (
                        <div className="p-12 text-center rounded-3xl border border-dashed border-surface-20">
                            <p className="text-sm text-text-muted">No settings found matching "{search}"</p>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="sticky top-6 space-y-6">
                        {scope === "ui" && (
                            <div className="p-6 rounded-3xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{appConfig.ui.language}</h3>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-all cursor-pointer"
                                        title="Add Language"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {LANGUAGES.map((lang) => (
                                        <div key={lang.code} className="group/lang relative">
                                            <button
                                                onClick={() => {
                                                    if (hasChanges && !confirm("You have unsaved changes. Switch language anyway?")) return;
                                                    setCurrentLang(lang.code);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm font-medium border ${
                                                    currentLang === lang.code
                                                        ? "bg-brand-500/10 text-brand-500 border-brand-500/20"
                                                        : "text-text-muted border-transparent hover:bg-surface-5 hover:text-text-base"
                                                }`}
                                            >
                                                {lang.name}
                                                {currentLang === lang.code && (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                            {currentLang === lang.code && lang.code !== 'en' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteLanguage(lang.code);
                                                    }}
                                                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-red-500 opacity-0 group-hover/lang:opacity-100 transition-all cursor-pointer"
                                                    title="Delete Language"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-6 rounded-3xl border border-surface-8 bg-brand-500/5 ring-1 ring-brand-500/10 shadow-sm">
                            <div className="flex items-center gap-2 text-brand-500 mb-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-xs font-bold uppercase tracking-widest">Tip</h3>
                            </div>
                            <p className="text-[11px] text-text-muted leading-relaxed">
                                Public keys are visible without authentication, while private keys are only used on the backend.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-md overflow-hidden rounded-5xl border border-surface-10 bg-bg-16 shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-surface-15">
                        <form onSubmit={handleCreateLanguage} className="p-10 space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-text-base tracking-tight">Add Language</h2>
                                <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-2">
                                    Create a new localization
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Language Code (e.g. en, pt-br)</label>
                                    <input
                                        type="text"
                                        required
                                        pattern="^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$"
                                        value={newCode}
                                        onChange={(e) => setNewCode(e.target.value.toLowerCase())}
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

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl border border-surface-15 text-text-muted font-black uppercase tracking-widest text-sm hover:bg-surface-5 transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-brand-500 text-on-brand font-black uppercase tracking-widest text-sm hover:bg-brand-600 shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                >
                                    {isCreating ? "Adding..." : "Add"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
