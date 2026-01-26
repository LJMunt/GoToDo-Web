import type { paths } from "./schema";
import { apiFetch, getToken } from "./http";

type MeRes =
    paths["/api/v1/users/me"]["get"]["responses"]["200"]["content"]["application/json"];

type UpdateMeReq =
    paths["/api/v1/users/me"]["patch"]["requestBody"]["content"]["application/json"];

export function getMe(): Promise<MeRes> {
    return apiFetch<MeRes>("/v1/users/me");
}

export async function updateMe(body: UpdateMeReq): Promise<MeRes> {
    const token = getToken();
    if (!token) throw new Error("not authenticated");

    try {
        return await apiFetch<MeRes>("/v1/users/me", {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    } catch (err: any) {
        // If updating profile fails with auth error, surface it clearly
        throw err;
    }
}
