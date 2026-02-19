import { apiFetch } from "./http";
import type { components } from "./schema";

import type { ConfigKey, ConfigTranslations, ConfigValues } from "../features/config/types";

export type User = components["schemas"]["AdminUser"];
export type Project = components["schemas"]["Project"];
export type Task = components["schemas"]["Task"];
export type Tag = components["schemas"]["Tag"];
export type Language = components["schemas"]["Language"];
export type AdminLanguage = components["schemas"]["AdminLanguage"];

export async function listUsers(): Promise<User[]> {
    return apiFetch<User[]>("/v1/admin/users");
}

export async function getUser(id: number): Promise<User> {
    return apiFetch<User>(`/v1/admin/users/${id}`);
}

export async function updateUser(id: number, body: { is_admin?: boolean; is_active?: boolean; password?: string }): Promise<void> {
    await apiFetch(`/v1/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export async function verifyUserEmail(id: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${id}/verify-email`, {
        method: "POST",
    });
}

export async function unverifyUserEmail(id: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${id}/unverify-email`, {
        method: "POST",
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

export async function getConfigValues(): Promise<ConfigValues> {
    return apiFetch<ConfigValues>("/v1/admin/config/values");
}

export async function updateConfigValues(values: ConfigValues): Promise<void> {
    await apiFetch("/v1/admin/config/values", {
        method: "PUT",
        body: JSON.stringify(values),
    });
}

export async function adminListLanguages(): Promise<AdminLanguage[]> {
    return apiFetch<AdminLanguage[]>("/v1/admin/lang");
}

export async function createLanguage(body: Language): Promise<AdminLanguage> {
    return apiFetch<AdminLanguage>("/v1/admin/lang", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function deleteLanguage(code: string): Promise<void> {
    await apiFetch(`/v1/admin/lang/${code}`, {
        method: "DELETE",
    });
}

export async function logoutUser(id: number): Promise<void> {
    await apiFetch(`/v1/admin/users/${id}/logout`, {
        method: "POST",
    });
}

export async function resetUserPassword(id: number, body: { password: string }): Promise<void> {
    await apiFetch(`/v1/admin/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}
