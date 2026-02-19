import { apiFetch } from "./http";
import type { ConfigStatus } from "../features/config/types";

export async function getConfigStatus(): Promise<ConfigStatus> {
    return apiFetch<ConfigStatus>("/v1/config/status");
}

export async function checkHealth(): Promise<void> {
    return apiFetch<void>("/v1/health");
}
