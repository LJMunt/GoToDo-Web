import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../api/http";
import { useConfig } from "../../features/config/ConfigContext";

import type { components } from "../../api/schema";
import { listUsers } from "../../api/admin";

type HealthStatus = "loading" | "healthy" | "unhealthy" | "error";

type DatabaseMetrics = components["schemas"]["DatabaseMetrics"];

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
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                    ),
                };
            case "unhealthy":
                return {
                    bg: "bg-orange-500/10",
                    border: "border-orange-500/20",
                    text: "text-orange-500",
                    icon: (
                        <span className="font-bold text-[10px]">!</span>
                    ),
                };
            case "error":
                return {
                    bg: "bg-red-500/10",
                    border: "border-red-500/20",
                    text: "text-red-500",
                    icon: (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ),
                };
            default:
                return {
                    bg: "bg-surface-10",
                    border: "border-surface-20",
                    text: "text-text-muted",
                    icon: <div className="w-1 h-1 rounded-full bg-current" />,
                };
        }
    };

    const styles = getStatusStyles();

    return (
        <div className="flex items-center justify-between p-6 rounded-3xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm">
            <span className="text-sm font-bold text-text-200 uppercase tracking-widest">{label}</span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border ${styles.bg} ${styles.border} ${styles.text}`}>
                <div className="flex items-center justify-center w-4 h-4 rounded-full border border-current">
                    {styles.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">{status}</span>
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
        <div className="p-6 rounded-3xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm flex flex-col justify-between hover:bg-surface-4 transition-all hover:scale-[1.01]">
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
                    <div className="text-2xl font-bold text-text-base mt-2">{value}</div>
                </div>
                {icon && <div className="p-3 rounded-2xl bg-surface-5 border border-surface-10 text-text-muted">{icon}</div>}
            </div>
            {description && <p className="text-xs text-text-muted mt-4 leading-relaxed font-medium opacity-80">{description}</p>}
        </div>
    );
}

export default function AdminDashboard() {
    const { config } = useConfig();
    const version = `v${import.meta.env.APP_VERSION}`;
    const [backendVersion, setBackendVersion] = useState<string>("loading...");
    const [healthStatus, setHealthStatus] = useState<HealthStatus>("loading");
    const [readyStatus, setReadyStatus] = useState<HealthStatus>("loading");
    const [userCount, setUserCount] = useState<number | "loading" | "error">("loading");
    const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
    const [metricsError, setMetricsError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
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
                const data = await listUsers();
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

        await Promise.allSettled([
            checkHealth(),
            checkReady(),
            fetchVersion(),
            fetchUserCount(),
            fetchMetrics(),
        ]);
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            void fetchData();
        }, 0);
        return () => clearTimeout(timeout);
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-base transition-none!">{config.navigation.dashboard}</h1>
                    <p className="text-sm text-text-muted mt-1">System status and overview.</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg bg-surface-5 border border-surface-10 text-text-muted hover:text-text-base hover:bg-surface-8 transition-all disabled:opacity-50 cursor-pointer"
                    title="Refresh data"
                >
                    <svg
                        className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">{config.ui.systemStatus}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatusIndicator label={config.ui.backendHealth} status={healthStatus} />
                    <StatusIndicator label={config.ui.dbReady} status={readyStatus} />
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">{config.ui.systemInformation}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-6 rounded-3xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm">
                        <span className="text-sm font-bold text-text-200 uppercase tracking-widest">{config.ui.webVersion}</span>
                        <span className="text-xs font-mono font-black px-3 py-1.5 rounded-2xl bg-surface-5 text-text-muted border border-surface-10 uppercase tracking-tighter">
                            {version}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-6 rounded-3xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm">
                        <span className="text-sm font-bold text-text-200 uppercase tracking-widest">{config.ui.backendVersion}</span>
                        <span className="text-xs font-mono font-black px-3 py-1.5 rounded-2xl bg-surface-5 text-text-muted border border-surface-10 uppercase tracking-tighter">
                            {backendVersion}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-6 rounded-3xl border border-surface-8 bg-surface-3 ring-1 ring-surface-10 shadow-sm">
                        <span className="text-sm font-bold text-text-200 uppercase tracking-widest">{config.ui.totalUsers}</span>
                        <span className="text-xs font-mono font-black px-3 py-1.5 rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase tracking-tighter">
                            {userCount === "loading" ? "..." : userCount === "error" ? config.ui.errorPrefix : userCount}
                        </span>
                    </div>
                </div>
            </div>

            {metricsError && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">{config.ui.databaseMetrics} {config.ui.errorPrefix}: {metricsError}</p>
                </div>
            )}

            {metrics && (
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">{config.ui.databaseMetrics}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard
                            label={config.ui.databaseSize}
                            value={metrics.database_size}
                            description="Total size of the database on disk"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7c0-1.1.9-2 2-2h12a2 2 0 012 2M4 7l8 4 8-4M4 11l8 4 8-4" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label={config.ui.activeConnections}
                            value={metrics.connections}
                            description="Number of currently active database connections"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label={config.ui.cacheHitRatio}
                            value={`${metrics.cache_hit_ratio.toFixed(2)}%`}
                            description="Percentage of disk blocks found in buffer cache"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label={config.ui.deadlocks}
                            value={metrics.deadlocks}
                            description="Total number of transaction conflicts detected"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label={config.ui.blocksRead}
                            value={metrics.blocks_read.toLocaleString()}
                            description="Total number of disk blocks read from storage"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                        />
                        <MetricCard
                            label={config.ui.blocksHit}
                            value={metrics.blocks_hit.toLocaleString()}
                            description="Total disk blocks found in buffer cache"
                            icon={(
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            )}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
