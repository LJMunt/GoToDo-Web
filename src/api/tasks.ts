import type { components, paths } from "./schema";
import { apiFetch } from "./http";

type UpdateTaskReq =
    paths["/api/v1/tasks/{id}"]["patch"]["requestBody"]["content"]["application/json"];

export function getTask(taskId: number): Promise<components["schemas"]["Task"]> {
    return apiFetch<components["schemas"]["Task"]>(`/v1/tasks/${taskId}`);
}

export function updateTask(taskId: number, body: UpdateTaskReq) {
    return apiFetch<void>(`/v1/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export function deleteTask(taskId: number) {
    return apiFetch<void>(`/v1/tasks/${taskId}`, {
        method: "DELETE",
    });
}

export function setTaskCompletion(taskId: number, completed: boolean) {
    return updateTask(taskId, { completed });
}

type UpdateOccurrenceReq =
    paths["/api/v1/tasks/{taskId}/occurrences/{occurrenceId}"]["patch"]["requestBody"]["content"]["application/json"];

export function setOccurrenceCompletion(taskId: number, occurrenceId: number, completed: boolean) {
    const body: UpdateOccurrenceReq = { completed };
    return apiFetch(`/v1/tasks/${taskId}/occurrences/${occurrenceId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

type ListOccurrencesRes =
    paths["/api/v1/tasks/{taskId}/occurrences"]["get"]["responses"]["200"]["content"]["application/json"];
type ListOccurrencesQuery =
    paths["/api/v1/tasks/{taskId}/occurrences"]["get"]["parameters"]["query"];

export function listTaskOccurrences(taskId: number, query: ListOccurrencesQuery = {}): Promise<ListOccurrencesRes> {
    const search = new URLSearchParams();
    if (query.from) search.set("from", query.from);
    if (query.to) search.set("to", query.to);
    const qs = search.toString();
    const url = qs ? `/v1/tasks/${taskId}/occurrences?${qs}` : `/v1/tasks/${taskId}/occurrences`;
    return apiFetch<ListOccurrencesRes>(url);
}

type TaskTagsRes =
    paths["/api/v1/tasks/{taskId}/tags"]["get"]["responses"]["200"]["content"]["application/json"];

export function getTaskTags(taskId: number): Promise<TaskTagsRes> {
    return apiFetch<TaskTagsRes>(`/v1/tasks/${taskId}/tags`);
}

type SetTaskTagsReq =
    paths["/api/v1/tasks/{taskId}/tags"]["put"]["requestBody"]["content"]["application/json"];

export function setTaskTags(taskId: number, tags?: string[], tagIds?: number[]): Promise<components["schemas"]["Tag"][]> {
    const body: SetTaskTagsReq = { tags, tag_ids: tagIds };
    return apiFetch<components["schemas"]["Tag"][]>(`/v1/tasks/${taskId}/tags`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}
