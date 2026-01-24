import type { paths } from "./schema";
import { apiFetch } from "./http";

type MeRes =
    paths["/api/v1/users/me"]["get"]["responses"]["200"]["content"]["application/json"];

export function getMe(): Promise<MeRes> {
    return apiFetch<MeRes>("/v1/users/me");
}
