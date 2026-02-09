import React, { createContext, useContext, useState, useEffect } from "react";
import { type AppConfig, DEFAULT_CONFIG } from "./types";

interface ConfigContextType {
    config: AppConfig;
    isLoading: boolean;
    error: string | null;
    refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshConfig = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // For now, we just use the default config. 
            // In the future, this will fetch from the backend.
            // const data = await apiFetch<AppConfig>("/v1/config");
            // setConfig(data);
            setConfig(DEFAULT_CONFIG);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch configuration");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void refreshConfig();
    }, []);

    return (
        <ConfigContext.Provider value={{ config, isLoading, error, refreshConfig }}>
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
