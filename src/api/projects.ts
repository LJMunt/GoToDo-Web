import type { components, paths } from "./schema";
import { apiFetch } from "./http";

type ListProjectsResponse =
    paths["/api/v1/projects"]["get"]["responses"]["200"]["content"]["application/json"];

type ListProjectTasksResponse =
    paths["/api/v1/projects/{projectId}/tasks"]["get"]["responses"]["200"]["content"]["application/json"];

type CreateTaskReq =
    paths["/api/v1/projects/{projectId}/tasks"]["post"]["requestBody"]["content"]["application/json"] & { tag_ids?: number[] };

type GetProjectResponse =
    paths["/api/v1/projects/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

type UpdateProjectReq =
    paths["/api/v1/projects/{id}"]["patch"]["requestBody"]["content"]["application/json"];

export type CreateProjectReq =
    paths["/api/v1/projects"]["post"]["requestBody"]["content"]["application/json"];

export function listProjects(): Promise<ListProjectsResponse> {
    return apiFetch<ListProjectsResponse>("/v1/projects");
}

export function getProject(id: number): Promise<GetProjectResponse> {
    return apiFetch<GetProjectResponse>(`/v1/projects/${id}`);
}

export function createProject(body: CreateProjectReq): Promise<GetProjectResponse> {
    return apiFetch<GetProjectResponse>("/v1/projects", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function updateProject(id: number, body: UpdateProjectReq): Promise<GetProjectResponse> {
    return apiFetch<GetProjectResponse>(`/v1/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export function deleteProject(id: number): Promise<void> {
    return apiFetch<void>(`/v1/projects/${id}`, {
        method: "DELETE",
    });
}

export function listProjectTasks(projectId: number): Promise<ListProjectTasksResponse> {
    return apiFetch<ListProjectTasksResponse>(`/v1/projects/${projectId}/tasks`);
}

export function createTask(projectId: number, body: CreateTaskReq): Promise<components["schemas"]["Task"]> {
    const finalBody = {
        ...body,
        tag_ids: body.tag_ids ?? [],
    };
    return apiFetch<components["schemas"]["Task"]>(`/v1/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(finalBody),
    });
}
