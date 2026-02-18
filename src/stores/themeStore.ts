import { create } from "zustand";
import { useAuthStore } from "./authStore";

export type Theme = "light" | "dark" | "system";

interface ThemeStore {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    applyTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
    theme: "system",
    setTheme: (newTheme: Theme) => {
        set({ theme: newTheme });
        get().applyTheme(newTheme);
    },
    applyTheme: (t: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        let effectiveTheme = t;
        if (t === "system") {
            effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }

        root.classList.add(effectiveTheme);
        root.style.colorScheme = effectiveTheme;
    },
}));

// Setup theme sync from auth
useAuthStore.subscribe((state) => {
    if (state.state.status === "authenticated" && state.state.user.settings?.theme) {
        const theme = state.state.user.settings.theme as Theme;
        useThemeStore.getState().setTheme(theme);
    }
});

// Setup system theme listener
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", () => {
    const { theme, applyTheme } = useThemeStore.getState();
    if (theme === "system") {
        applyTheme("system");
    }
});
