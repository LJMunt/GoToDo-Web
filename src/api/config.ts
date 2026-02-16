import { apiFetch } from "./http";
import type { ConfigStatus } from "../features/config/types";

export async function getConfigStatus(): Promise<ConfigStatus> {
    return apiFetch<ConfigStatus>("/v1/config/status");
}
