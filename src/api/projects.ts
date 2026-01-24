import type { paths } from "./schema";
import { apiFetch } from "./http";

type ListProjectsResponse =
    paths["/api/v1/projects"]["get"]["responses"]["200"]["content"]["application/json"];

type ListProjectTasksResponse =
    paths["/api/v1/projects/{projectId}/tasks"]["get"]["responses"]["200"]["content"]["application/json"];

export function listProjects(): Promise<ListProjectsResponse> {
    return apiFetch<ListProjectsResponse>("/v1/projects");
}

export function listProjectTasks(projectId: number): Promise<ListProjectTasksResponse> {
    return apiFetch<ListProjectTasksResponse>(`/v1/projects/${projectId}/tasks`);
}
