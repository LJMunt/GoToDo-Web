import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./index.css";
import { AuthProvider } from "./features/auth/AuthContext";
import { ThemeProvider } from "./features/theme/ThemeContext";
import { ConfigProvider } from "./features/config/ConfigContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ConfigProvider>
            <AuthProvider>
                <ThemeProvider>
                    <RouterProvider router={router} />
                </ThemeProvider>
            </AuthProvider>
        </ConfigProvider>
    </React.StrictMode>
);
