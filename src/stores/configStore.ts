import { create } from "zustand";
import { type AppConfig, DEFAULT_CONFIG, type ConfigStatus } from "../features/config/types";
import { apiFetch } from "../api/http";
import { getConfigStatus } from "../api/config";
import { listLanguages, type Language } from "../api/languages";
import { updateMe } from "../api/users";
import { useAuthStore } from "./authStore";

interface ConfigStore {
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
        } else if (sourceValue !== undefined && sourceValue !== null && (typeof sourceValue !== "string" || sourceValue !== "")) {
            result[key] = sourceValue;
        }
    }
    return result as unknown as T;
}

function expandDotNotation(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    const assign = (target: Record<string, unknown>, parts: string[], value: unknown) => {
        const [head, ...rest] = parts;
        if (!head) return;

        if (rest.length === 0) {
            target[head] = value;
            return;
        }

        if (!target[head] || typeof target[head] !== "object" || Array.isArray(target[head])) {
            target[head] = {};
        }

        assign(target[head] as Record<string, unknown>, rest, value);
    };

    for (const [key, value] of Object.entries(obj)) {
        if (key.includes(".")) {
            assign(result, key.split("."), value);
        } else {
            result[key] = value;
        }
    }

    const uiKeys = new Set(Object.keys(DEFAULT_CONFIG.ui));
    for (const [key, value] of Object.entries(obj)) {
        if (!key.includes(".") && uiKeys.has(key)) {
            if (!result.ui || typeof result.ui !== "object" || Array.isArray(result.ui)) {
                result.ui = {};
            }
            const ui = result.ui as Record<string, unknown>;
            if (ui[key] === undefined || ui[key] === null) {
                ui[key] = value;
            }
            delete result[key];
        }
    }

    return result;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
    config: DEFAULT_CONFIG,
    status: null,
    isLoading: false,
    error: null,
    language: localStorage.getItem("language") ?? "en",
    availableLanguages: [],

    setLanguage: async (lang: string) => {
        set({ language: lang });
        localStorage.setItem("language", lang);

        const authState = useAuthStore.getState().state;
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
        await get().refreshConfig();
    },

    refreshConfig: async () => {
        set({ isLoading: true, error: null });
        try {
            const { language } = get();
            const [configData, statusData] = await Promise.all([
                apiFetch<Record<string, unknown>>(`/v1/config?lang=${language}`),
                getConfigStatus()
            ]);
            const expanded = expandDotNotation(configData);
            set({
                config: deepMerge<AppConfig>(DEFAULT_CONFIG, expanded as Partial<AppConfig>),
                status: statusData,
                isLoading: false
            });
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : "Failed to fetch configuration",
                config: DEFAULT_CONFIG,
                isLoading: false
            });
        }
    },

    fetchLanguages: async () => {
        try {
            const langs = await listLanguages();
            set({ availableLanguages: langs });
        } catch (err) {
            console.error("Failed to fetch languages", err);
        }
    },
}));

// Sync language from auth
useAuthStore.subscribe((state) => {
    if (state.state.status === "authenticated" && state.state.user.settings?.language) {
        const userLang = state.state.user.settings.language;
        const currentLang = useConfigStore.getState().language;
        if (userLang !== currentLang) {
            useConfigStore.getState().setLanguage(userLang);
        }
    }
});
