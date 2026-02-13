import React, { createContext, useContext, useState, useEffect } from "react";
import { type AppConfig, DEFAULT_CONFIG } from "./types";

import { apiFetch } from "../../api/http";

interface ConfigContextType {
    config: AppConfig;
    isLoading: boolean;
    error: string | null;
    language: string;
    setLanguage: (lang: string) => void;
    refreshConfig: () => Promise<void>;
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
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguageState] = useState<string>(() => localStorage.getItem("language") ?? "en");

    const setLanguage = (lang: string) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
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
        void refreshConfig();
    }, [language]);

    return (
        <ConfigContext.Provider value={{ config, isLoading, error, language, setLanguage, refreshConfig }}>
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
