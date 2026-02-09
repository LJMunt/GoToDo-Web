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
            const data = await apiFetch<AppConfig>(`/v1/config?lang=${language}`);
            setConfig(data);
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
