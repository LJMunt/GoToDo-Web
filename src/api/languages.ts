import { apiFetch } from "./http";
import type { components } from "./schema";

export type Language = components["schemas"]["Language"];

export async function listLanguages(): Promise<Language[]> {
    return apiFetch<Language[]>("/v1/lang");
}
