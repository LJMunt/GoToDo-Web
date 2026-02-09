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

function deepMerge<T extends object>(target: T, source: any): T {
    const result = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = (target as any)[key];

            if (
                sourceValue &&
                typeof sourceValue === "object" &&
                !Array.isArray(sourceValue) &&
                targetValue &&
                typeof targetValue === "object"
            ) {
                (result as any)[key] = deepMerge(targetValue, sourceValue);
            } else if (sourceValue !== undefined) {
                (result as any)[key] = sourceValue;
            }
        }
    }
    return result;
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
            const data = await apiFetch<any>(`/v1/config?lang=${language}`);
            setConfig(deepMerge(DEFAULT_CONFIG, data));
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

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error("useConfig must be used within a ConfigProvider");
    }
    return context;
}
