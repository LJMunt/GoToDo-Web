import { useEffect, useState } from "react";
import { apiFetch } from "../../api/http";

type HealthStatus = "loading" | "healthy" | "unhealthy" | "error";

interface StatusIndicatorProps {
    status: HealthStatus;
    label: string;
}

function StatusIndicator({ status, label }: StatusIndicatorProps) {
    const getStatusStyles = () => {
        switch (status) {
            case "healthy":
                return {
                    bg: "bg-green-500/10",
                    border: "border-green-500/20",
                    text: "text-green-500",
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    ),
                };
            case "unhealthy":
                return {
                    bg: "bg-orange-500/10",
                    border: "border-orange-500/20",
                    text: "text-orange-500",
                    icon: (
                        <span className="font-bold text-xs">!</span>
                    ),
                };
            case "error":
                return {
                    bg: "bg-red-500/10",
                    border: "border-red-500/20",
                    text: "text-red-500",
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ),
                };
            default:
                return {
                    bg: "bg-surface-10",
                    border: "border-surface-20",
                    text: "text-text-muted",
                    icon: <div className="w-1 h-1 rounded-full bg-current animate-pulse" />,
                };
        }
    };

    const styles = getStatusStyles();

    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-surface-8 bg-surface-3">
            <span className="text-sm font-medium text-text-200">{label}</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${styles.bg} ${styles.border} ${styles.text}`}>
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-current">
                    {styles.icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const version = `v${import.meta.env.APP_VERSION}`;
    const [healthStatus, setHealthStatus] = useState<HealthStatus>("loading");
    const [readyStatus, setReadyStatus] = useState<HealthStatus>("loading");

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const data = await apiFetch<{ status: string }>("/v1/health");
                setHealthStatus(data.status === "ok" ? "healthy" : "unhealthy");
            } catch (e) {
                setHealthStatus("error");
                console.error("Error checking health:", e);
            }
        };

        const checkReady = async () => {
            try {
                const data = await apiFetch<{ ready: boolean }>("/v1/ready");
                setReadyStatus(data.ready ? "healthy" : "unhealthy");
            } catch (e) {
                setReadyStatus("error");
                console.error("Error checking readiness:", e);
            }
        };

        checkHealth();
        checkReady();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-base">Admin Dashboard</h1>
                <p className="text-sm text-text-muted mt-1">System status and overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatusIndicator label="Backend Health" status={healthStatus} />
                <StatusIndicator label="DB Ready" status={readyStatus} />
                <div className="flex items-center justify-between p-4 rounded-xl border border-surface-8 bg-surface-3">
                    <span className="text-sm font-medium text-text-200">Web Version</span>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-surface-10 text-text-muted border border-surface-20">
                        {version}
                    </span>
                </div>
            </div>
        </div>
    );
}
