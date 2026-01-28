import { useEffect, useState } from "react";
import { apiFetch } from "../../api/http";

type HealthStatus = "loading" | "healthy" | "unhealthy" | "error";

interface DatabaseMetrics {
    database_size: string;
    connections: number;
    deadlocks: number;
    blocks_read: number;
    blocks_hit: number;
    cache_hit_ratio: number;
}

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

interface MetricCardProps {
    label: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
}

function MetricCard({ label, value, description, icon }: MetricCardProps) {
    return (
        <div className="p-4 rounded-xl border border-surface-8 bg-surface-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
                    <div className="text-xl font-bold text-text-base mt-1">{value}</div>
                </div>
                {icon && <div className="p-2 rounded-lg bg-surface-10 text-text-muted">{icon}</div>}
            </div>
            {description && <p className="text-xs text-text-muted mt-2">{description}</p>}
        </div>
    );
}

export default function AdminDashboard() {
    const version = `v${import.meta.env.APP_VERSION}`;
    const [backendVersion, setBackendVersion] = useState<string>("loading...");
    const [healthStatus, setHealthStatus] = useState<HealthStatus>("loading");
    const [readyStatus, setReadyStatus] = useState<HealthStatus>("loading");
    const [userCount, setUserCount] = useState<number | "loading" | "error">("loading");
    const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
    const [metricsError, setMetricsError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const data = await apiFetch<{ version: string }>("/v1/version");
                setBackendVersion(data.version);
            } catch (e) {
                setBackendVersion("error");
                console.error("Error fetching version:", e);
            }
        };

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

        const fetchUserCount = async () => {
            try {
                const data = await apiFetch<any[]>("/v1/admin/users");
                setUserCount(data.length);
            } catch (e) {
                setUserCount("error");
                console.error("Error fetching user count:", e);
            }
        };

        const fetchMetrics = async () => {
            try {
                const data = await apiFetch<DatabaseMetrics>("/v1/admin/metrics");
                setMetrics(data);
                setMetricsError(null);
            } catch (e) {
                console.error("Error fetching metrics:", e);
                setMetricsError(e instanceof Error ? e.message : String(e));
            }
        };

        checkHealth();
        checkReady();
        fetchVersion();
        fetchUserCount();
        fetchMetrics();
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
                <div className="flex items-center justify-between p-4 rounded-xl border border-surface-8 bg-surface-3">
                    <span className="text-sm font-medium text-text-200">Backend Version</span>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-surface-10 text-text-muted border border-surface-20">
                        {backendVersion}
                    </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-surface-8 bg-surface-3">
                    <span className="text-sm font-medium text-text-200">Users</span>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                        {userCount === "loading" ? "..." : userCount === "error" ? "Error" : userCount}
                    </span>
                </div>
            </div>

            {metricsError && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500">
                    <p className="text-sm font-medium">Failed to load database metrics: {metricsError}</p>
                </div>
            )}

            {metrics && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-base">Database Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard
                            label="Database Size"
                            value={metrics.database_size}
                            description="Total size of the database"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7c0-1.1.9-2 2-2h12a2 2 0 012 2M4 7l8 4 8-4M4 11l8 4 8-4" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label="Active Connections"
                            value={metrics.connections}
                            description="Number of active DB connections"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label="Cache Hit Ratio"
                            value={`${metrics.cache_hit_ratio.toFixed(2)}%`}
                            description="Percentage of disk blocks found in buffer cache"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label="Deadlocks"
                            value={metrics.deadlocks}
                            description="Total number of transaction conflicts detected"
                        />
                        <MetricCard
                            label="Blocks Read"
                            value={metrics.blocks_read.toLocaleString()}
                            description="Total number of disk blocks read from storage"
                        />
                        <MetricCard
                            label="Blocks Hit"
                            value={metrics.blocks_hit.toLocaleString()}
                            description="Total disk blocks found in buffer cache"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
