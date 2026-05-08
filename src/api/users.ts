import type { paths } from "./schema";
import { apiFetch, getToken } from "./http";

type MeRes =
    paths["/api/v1/users/me"]["get"]["responses"]["200"]["content"]["application/json"];

export type UpdateMeReq =
    paths["/api/v1/users/me"]["patch"]["requestBody"]["content"]["application/json"];

export function getMe(): Promise<MeRes> {
    return apiFetch<MeRes>("/v1/users/me", { skipWorkspace: true });
}

export async function updateMe(body: UpdateMeReq): Promise<MeRes> {
    const token = getToken();
    if (!token) throw new Error("not authenticated");

    // eslint-disable-next-line no-useless-catch
    try {
        return await apiFetch<MeRes>("/v1/users/me", {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    } catch (err: unknown) {
        // If updating profile fails with auth error, surface it clearly
        throw err;
    }
}

export async function deleteMe(currentPassword: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error("not authenticated");

    await apiFetch<void>("/v1/users/me", {
        method: "DELETE",
        body: JSON.stringify({ currentPassword }),
    });
}

export function searchUserByEmail(email: string): Promise<paths["/api/v1/users/search"]["get"]["responses"]["200"]["content"]["application/json"]> {
    return apiFetch<paths["/api/v1/users/search"]["get"]["responses"]["200"]["content"]["application/json"]>(`/v1/users/search?email=${encodeURIComponent(email)}`, {
        skipWorkspace: true,
    });
}

export interface UserSearchResult {
    public_id: string;
    email: string;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
    // Attempt search by email (exact match) as per openapi.yml
    try {
        const res = await apiFetch<any>(`/v1/users/search?email=${encodeURIComponent(query)}`, {
            skipWorkspace: true,
        });
        if (res && (res.public_id || res.id)) {
            return [{
                public_id: res.public_id || res.id,
                email: res.email
            }];
        }
    } catch (err) {
        // Fallback to q parameter if email search fails, or if backend supports q for partial match
        try {
            const resQ = await apiFetch<any>(`/v1/users/search?q=${encodeURIComponent(query)}`, {
                skipWorkspace: true,
            });
            if (Array.isArray(resQ)) {
                return resQ.map((u: any) => ({
                    public_id: u.public_id || u.id,
                    email: u.email
                }));
            }
            if (resQ && (resQ.public_id || resQ.id)) {
                return [{
                    public_id: resQ.public_id || resQ.id,
                    email: resQ.email
                }];
            }
        } catch (err2) {
            console.error("Search failed:", err2);
        }
    }
    return [];
}
