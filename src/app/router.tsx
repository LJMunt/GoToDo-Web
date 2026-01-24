import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/LoginPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <div className="p-6">Home (later: projects)</div> },
        ],
    },
    { path: "/login", element: <LoginPage /> },
]);
