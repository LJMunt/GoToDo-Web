import { apiFetch } from "./http";
import type { paths } from "./schema";

type MeRes =
    paths["/api/v1/users/me"]["get"]["responses"]["200"]["content"]["application/json"];

export function getMe(): Promise<MeRes> {
    return apiFetch<MeRes>("/api/v1/users/me");
}
