import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { version } from "./package.json";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.APP_VERSION": JSON.stringify(version),
    },
    server: {
      proxy: env.VITE_API_PROXY_TARGET
          ? {
            "/api": {
              target: env.VITE_API_PROXY_TARGET,
              changeOrigin: true,
            },
          }
          : undefined,
    },
  };
});
