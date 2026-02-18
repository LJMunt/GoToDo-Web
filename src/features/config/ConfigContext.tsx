import React, { createContext, useContext, useEffect } from "react";
import { type AppConfig, type ConfigStatus } from "./types";
import { type Language } from "../../api/languages";
import { useConfigStore } from "../../stores/configStore";

interface ConfigContextType {
    config: AppConfig;
    status: ConfigStatus | null;
    isLoading: boolean;
    error: string | null;
    language: string;
    availableLanguages: Language[];
    setLanguage: (lang: string) => Promise<void>;
    refreshConfig: () => Promise<void>;
    fetchLanguages: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const store = useConfigStore();

    useEffect(() => {
        void store.fetchLanguages();
        void store.refreshConfig();
    }, [store.language]);

    return (
        <ConfigContext.Provider value={store}>
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
