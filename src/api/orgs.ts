import { apiFetch } from "./http";
import type { components } from "./schema";

export async function listOrganizations(): Promise<components["schemas"]["Organization"][]> {
    return apiFetch<components["schemas"]["Organization"][]>("/v1/orgs");
}

export async function createOrganization(name: string): Promise<components["schemas"]["Organization"]> {
    return apiFetch<components["schemas"]["Organization"]>("/v1/orgs", {
        method: "POST",
        body: JSON.stringify({ name }),
    });
}

export async function getOrganization(id: number): Promise<components["schemas"]["Organization"]> {
    return apiFetch<components["schemas"]["Organization"]>(`/v1/orgs/${id}`);
}

export async function updateOrganization(id: number, name: string): Promise<void> {
    await apiFetch<void>(`/v1/orgs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
    });
}

export async function deleteOrganization(id: number): Promise<void> {
    await apiFetch<void>(`/v1/orgs/${id}`, {
        method: "DELETE",
    });
}

export async function listOrgMembers(id: number): Promise<components["schemas"]["OrgMember"][]> {
    return apiFetch<components["schemas"]["OrgMember"][]>(`/v1/orgs/${id}/members`);
}

export async function addOrUpdateOrgMember(
    orgId: number,
    userPublicId: string,
    role: string
): Promise<components["schemas"]["OrgMember"]> {
    return apiFetch<components["schemas"]["OrgMember"]>(`/v1/orgs/${orgId}/members`, {
        method: "POST",
        body: JSON.stringify({ public_id: userPublicId, role }),
    });
}

export async function removeOrgMember(orgId: number, userPublicId: string): Promise<void> {
    await apiFetch<void>(`/v1/orgs/${orgId}/members/${userPublicId}`, {
        method: "DELETE",
    });
}

export async function leaveOrganization(id: number): Promise<void> {
    return apiFetch<void>(`/v1/orgs/${id}/leave`, {
        method: "POST",
    });
}
