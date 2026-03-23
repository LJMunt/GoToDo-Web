import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useConfig } from "../config/ConfigContext";

export default function RequireOrganizations({ children }: { children: React.ReactNode }) {
    const { status } = useConfig();
    const location = useLocation();

    if (!status) {
        return null; // Or a loading spinner
    }

    if (!status.features.organizations) {
        return <Navigate to="/" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}
