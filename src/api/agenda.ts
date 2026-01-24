import type { paths } from "./schema";
import { apiFetch } from "./http";

type AgendaQuery =
    paths["/api/v1/agenda"]["get"]["parameters"]["query"];
type AgendaResponse =
    paths["/api/v1/agenda"]["get"]["responses"]["200"]["content"]["application/json"];

export function getAgenda(params: AgendaQuery = {}): Promise<AgendaResponse> {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);

    const query = search.toString();
    const url = query ? `/v1/agenda?${query}` : "/v1/agenda";
    return apiFetch<AgendaResponse>(url);
}
