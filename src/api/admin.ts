import { apiFetch } from "./http";
import type { components } from "./schema";

export type User = components["schemas"]["User"];
export type Project = components["schemas"]["Project"];
export type Task = components["schemas"]["Task"];

export async function listUsers(): Promise<User[]> {
    return apiFetch<User[]>("/v1/admin/users");
}

export async function getUser(id: number): Promise<User> {
    return apiFetch<User>(`/v1/admin/users/${id}`);
}

export async function updateUser(id: number, body: { is_active?: boolean; password?: string }): Promise<void> {
    await apiFetch(`/v1/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export async function listUserProjects(userId: number): Promise<Project[]> {
    return apiFetch<Project[]>(`/v1/admin/users/${userId}/projects`);
}

export async function listUserProjectTasks(userId: number, projectId: number): Promise<Task[]> {
    return apiFetch<Task[]>(`/v1/admin/users/${userId}/projects/${projectId}/tasks`);
}
