import { apiFetch } from "./http";
import type { components } from "./schema";

export type User = components["schemas"]["User"];

export async function listUsers(): Promise<User[]> {
    return apiFetch<User[]>("/v1/admin/users");
}
