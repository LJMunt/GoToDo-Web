import React, { createContext, useContext, useState, useEffect } from "react";
import { type AppConfig, DEFAULT_CONFIG } from "./types";

import { apiFetch } from "../../api/http";
import { listLanguages, type Language } from "../../api/languages";
import { updateMe } from "../../api/users";
import { useAuth } from "../auth/AuthContext";

interface ConfigContextType {
    config: AppConfig;
    isLoading: boolean;
    error: string | null;
    language: string;
    availableLanguages: Language[];
    setLanguage: (lang: string) => void;
    refreshConfig: () => Promise<void>;
    fetchLanguages: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...(target as object) } as unknown as Record<string, unknown>;
    const src = source as unknown as Record<string, unknown>;
    const tgt = target as unknown as Record<string, unknown>;

    for (const key of Object.keys(src)) {
        const sourceValue = src[key];
        const targetValue = tgt[key];

        if (
            sourceValue &&
            typeof sourceValue === "object" &&
            !Array.isArray(sourceValue) &&
            targetValue &&
            typeof targetValue === "object" &&
            !Array.isArray(targetValue)
        ) {
            result[key] = deepMerge(targetValue as object, sourceValue as object) as unknown;
        } else if (sourceValue !== undefined) {
            result[key] = sourceValue;
        }
    }
    return result as unknown as T;
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const { state: authState } = useAuth();
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguageState] = useState<string>(() => localStorage.getItem("language") ?? "en");
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);

    const setLanguage = async (lang: string) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);

        if (authState.status === "authenticated") {
            try {
                await updateMe({
                    settings: {
                        ...authState.user.settings,
                        language: lang,
                    },
                });
            } catch (err) {
                console.error("Failed to update user language", err);
            }
        }
    };

    useEffect(() => {
        if (authState.status === "authenticated" && authState.user.settings?.language) {
            const userLang = authState.user.settings.language;
            if (userLang !== language) {
                setLanguageState(userLang);
                localStorage.setItem("language", userLang);
                void refreshConfig(); // Fetch translations for the user's language
            }
        }
    }, [authState]);

    const fetchLanguages = async () => {
        try {
            const langs = await listLanguages();
            setAvailableLanguages(langs);
        } catch (err) {
            console.error("Failed to fetch languages", err);
        }
    };

    const refreshConfig = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiFetch<Partial<AppConfig>>(`/v1/config?lang=${language}`);
            setConfig(deepMerge<AppConfig>(DEFAULT_CONFIG, data));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch configuration");
            // Fallback to default config on error
            setConfig(DEFAULT_CONFIG);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchLanguages();
    }, []);

    useEffect(() => {
        void refreshConfig();
    }, [language]);

    return (
        <ConfigContext.Provider value={{ config, isLoading, error, language, availableLanguages, setLanguage, refreshConfig, fetchLanguages }}>
            {children}
        </ConfigContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components -- exporting hook from the context module is intentional.
export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error("useConfig must be used within a ConfigProvider");
    }
    return context;
}
