import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import RequireAuth from "../features/auth/RequireAuth";
import RequireAdmin from "../features/auth/RequireAdmin";
import HomePage from "../pages/HomePage";
import UserSettingsPage from "../pages/UserSettingsPage";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import UserDataView from "../pages/admin/UserDataView";
import ConfigManagement from "../pages/admin/ConfigManagement";

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
            {
                path: "admin",
                element: (
                    <RequireAdmin>
                        <AdminLayout />
                    </RequireAdmin>
                ),
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: "users", element: <UserManagement /> },
                    { path: "users/:userId/:tab", element: <UserDataView /> },
                    { path: "config", element: <ConfigManagement /> },
                    { path: "jobs", element: <div>Jobs</div> },
                ],
            },
        ],
    },
    { path: "/login", element: <LoginPage /> },
    { path: "/signup", element: <SignupPage /> },
]);
