import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import RequireAuth from "../features/auth/RequireAuth";
import HomePage from "../pages/HomePage";
import UserSettingsPage from "../pages/UserSettingsPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <RequireAuth>
                <AppLayout />
            </RequireAuth>
        ),
        children: [
            { index: true, element: <HomePage /> },
            { path: "projects/:projectId", element: <HomePage /> },
            { path: "settings", element: <UserSettingsPage /> },
        ],
    },
    { path: "/login", element: <LoginPage /> },
    { path: "/signup", element: <SignupPage /> },
]);
