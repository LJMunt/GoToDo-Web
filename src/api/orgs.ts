import type { paths } from "./schema";
import { apiFetch } from "./http";

export type Organization =
    paths["/api/v1/orgs"]["get"]["responses"]["200"]["content"]["application/json"][number];
export type OrgMember =
    paths["/api/v1/orgs/{id}/members"]["get"]["responses"]["200"]["content"]["application/json"][number];

export function getOrgs(): Promise<Organization[]> {
    return apiFetch<Organization[]>("/v1/orgs", { skipWorkspace: true });
}

export function createOrg(name: string): Promise<Organization> {
    return apiFetch<Organization>("/v1/orgs", {
        method: "POST",
        body: JSON.stringify({ name }),
        skipWorkspace: true,
    });
}

export function getOrgMembers(id: number): Promise<OrgMember[]> {
    return apiFetch<OrgMember[]>(`/v1/orgs/${id}/members`);
}

export function updateOrg(id: number, name: string): Promise<void> {
    return apiFetch<void>(`/v1/orgs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
    });
}

export function addOrgMember(id: number, publicId: string, role: OrgMember["role"] = "member"): Promise<void> {
    return apiFetch<void>(`/v1/orgs/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ public_id: publicId, role }),
    });
}

export function removeOrgMember(id: number, userId: string): Promise<void> {
    return apiFetch<void>(`/v1/orgs/${id}/members/${userId}`, {
        method: "DELETE",
    });
}

export function deleteOrg(id: number): Promise<void> {
    return apiFetch<void>(`/v1/orgs/${id}`, {
        method: "DELETE",
    });
}

export function leaveOrg(id: number): Promise<void> {
    return apiFetch<void>(`/v1/orgs/${id}/leave`, {
        method: "POST",
    });
}
