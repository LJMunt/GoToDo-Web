import type { components, paths } from "./schema";
import { apiFetch } from "./http";

type ListTagsRes =
    paths["/api/v1/tags"]["get"]["responses"]["200"]["content"]["application/json"];
type CreateTagReq = {
    name: string;
    color?:
        | "slate"
        | "gray"
        | "red"
        | "orange"
        | "amber"
        | "yellow"
        | "lime"
        | "green"
        | "emerald"
        | "teal"
        | "cyan"
        | "sky"
        | "blue"
        | "indigo"
        | "violet"
        | "purple"
        | "pink";
};
type UpdateTagReq = {
    name?: string;
    color?:
        | "slate"
        | "gray"
        | "red"
        | "orange"
        | "amber"
        | "yellow"
        | "lime"
        | "green"
        | "emerald"
        | "teal"
        | "cyan"
        | "sky"
        | "blue"
        | "indigo"
        | "violet"
        | "purple"
        | "pink";
};

export function listTags(): Promise<ListTagsRes> {
    return apiFetch<ListTagsRes>("/v1/tags");
}

export function createTag(body: CreateTagReq): Promise<components["schemas"]["Tag"]> {
    return apiFetch<components["schemas"]["Tag"]>("/v1/tags", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function updateTag(tagId: number, body: UpdateTagReq): Promise<components["schemas"]["Tag"]> {
    return apiFetch<components["schemas"]["Tag"]>(`/v1/tags/${tagId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export function deleteTag(tagId: number): Promise<void> {
    return apiFetch<void>(`/v1/tags/${tagId}`, {
        method: "DELETE",
    });
}
