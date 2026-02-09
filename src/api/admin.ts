import { apiFetch } from "./http";
import type { components } from "./schema";

import type { ConfigKey, ConfigTranslations } from "../features/config/types";

export type User = components["schemas"]["User"];
export type Project = components["schemas"]["Project"];
export type Task = components["schemas"]["Task"];
export type Tag = components["schemas"]["Tag"];

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

export async function listUserProjects(userId: number, includeDeleted?: boolean): Promise<Project[]> {
    const query = includeDeleted ? "?include_deleted=true" : "";
    return apiFetch<Project[]>(`/v1/admin/users/${userId}/projects${query}`);
}

export async function listUserProjectTasks(userId: number, projectId: number): Promise<Task[]> {
    return apiFetch<Task[]>(`/v1/admin/users/${userId}/projects/${projectId}/tasks`);
}

export async function updateUserProject(userId: number, projectId: number, body: { name?: string; description?: string | null }): Promise<Project> {
    return apiFetch<Project>(`/v1/admin/users/${userId}/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export async function deleteUserProject(userId: number, projectId: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${userId}/projects/${projectId}`, {
        method: "DELETE",
    });
}

export async function restoreUserProject(userId: number, projectId: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${userId}/projects/${projectId}/restore`, {
        method: "POST",
    });
}

export async function listUserTasks(userId: number, includeDeleted?: boolean): Promise<Task[]> {
    const query = includeDeleted ? "?include_deleted=true" : "";
    return apiFetch<Task[]>(`/v1/admin/users/${userId}/tasks${query}`);
}

export async function deleteUserTask(userId: number, taskId: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${userId}/tasks/${taskId}`, {
        method: "DELETE",
    });
}

export async function restoreUserTask(userId: number, taskId: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${userId}/tasks/${taskId}/restore`, {
        method: "POST",
    });
}

export async function listUserTags(userId: number): Promise<Tag[]> {
    return apiFetch<Tag[]>(`/v1/admin/users/${userId}/tags`);
}

export async function deleteUserTag(userId: number, tagId: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${userId}/tags/${tagId}`, {
        method: "DELETE",
    });
}

export async function listConfigKeys(): Promise<ConfigKey[]> {
    return apiFetch<ConfigKey[]>("/v1/admin/config/keys");
}

export async function getConfigTranslations(lang: string): Promise<ConfigTranslations> {
    return apiFetch<ConfigTranslations>(`/v1/admin/config/translations?lang=${lang}`);
}

export async function updateConfigTranslations(lang: string, translations: ConfigTranslations): Promise<void> {
    await apiFetch(`/v1/admin/config/translations?lang=${lang}`, {
        method: "PUT",
        body: JSON.stringify(translations),
    });
}
