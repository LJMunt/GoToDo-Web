import type { paths } from "./schema";
import { apiFetch } from "./http";

type ListTagsRes =
    paths["/api/v1/tags"]["get"]["responses"]["200"]["content"]["application/json"];

export function listTags(): Promise<ListTagsRes> {
    return apiFetch<ListTagsRes>("/v1/tags");
}
