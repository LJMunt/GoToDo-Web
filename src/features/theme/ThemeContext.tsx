import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { state } = useAuth();
    const [theme, setThemeState] = useState<Theme>("system");

    // Initialize theme from user settings when authenticated
    useEffect(() => {
        if (state.status === "authenticated" && state.user.settings?.theme) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setThemeState(state.user.settings.theme as Theme);
        }
    }, [state]);

    useEffect(() => {
        const root = window.document.documentElement;
        
        function applyTheme(t: Theme) {
            root.classList.remove("light", "dark");
            
            let effectiveTheme = t;
            if (t === "system") {
                effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            
            root.classList.add(effectiveTheme);
            root.style.colorScheme = effectiveTheme;
        }

        applyTheme(theme);

        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = () => applyTheme("system");
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        // Note: The actual update to the backend is handled by UserSettingsPage for now
        // but we could also add it here if we want a global setTheme that persists.
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components -- exporting hook from the context module is intentional.
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
