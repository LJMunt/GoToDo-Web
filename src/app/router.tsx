import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/LoginPage";
import MFAPage from "../pages/MFAPage";
import SignupPage from "../pages/SignupPage";
import RequireAuth from "../features/auth/RequireAuth";
import RequireAdmin from "../features/auth/RequireAdmin";
import HomePage from "../pages/HomePage";
import UserSettingsPage from "../pages/UserSettingsPage";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import UserDataView from "../pages/admin/UserDataView";
import OrganizationManagement from "../pages/admin/OrganizationManagement";
import OrganizationDataView from "../pages/admin/OrganizationDataView";
import ConfigManagement from "../pages/admin/ConfigManagement";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import RequestPasswordResetPage from "../pages/RequestPasswordResetPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import OrganizationsPage from "../pages/OrganizationsPage";
import RequireOrganizations from "../features/config/RequireOrganizations";

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
                path: "organizations",
                element: (
                    <RequireOrganizations>
                        <OrganizationsPage />
                    </RequireOrganizations>
                ),
            },
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
                    { path: "organizations", element: <OrganizationManagement /> },
                    { path: "organizations/:orgId/:tab", element: <OrganizationDataView /> },
                    { path: "config", element: <ConfigManagement /> },
                    { path: "jobs", element: <div>Jobs</div> },
                ],
            },
        ],
    },
    { path: "/login", element: <LoginPage /> },
    { path: "/mfa", element: <MFAPage /> },
    { path: "/signup", element: <SignupPage /> },
    { path: "/verify-email", element: <VerifyEmailPage /> },
    { path: "/request-password-reset", element: <RequestPasswordResetPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },
]);
