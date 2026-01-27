import { apiFetch } from "./http";
import type { components } from "./schema";

export type User = components["schemas"]["User"];

export async function listUsers(): Promise<User[]> {
    return apiFetch<User[]>("/v1/admin/users");
}

export async function updateUser(id: number, body: { is_active?: boolean; password?: string }): Promise<void> {
    await apiFetch(`/v1/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}
