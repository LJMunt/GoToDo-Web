export type RuntimeConfig = {
    API_BASE?: string; // e.g. "http://backend:8081" or "/api"
};

declare global {
    interface Window {
        __CONFIG__?: RuntimeConfig;
    }
}

// Prefer runtime config, fallback to Vite build-time env, fallback to "/api"
export const runtimeConfig = {
    apiBase: window.__CONFIG__?.API_BASE ?? import.meta.env.VITE_API_BASE ?? "/api",
};
