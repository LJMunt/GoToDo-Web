import { apiFetch, setToken } from "./http";
import type { paths } from "./schema"; // comes from schema.d.ts

// Helper types from OpenAPI
type LoginReq =
    paths["/api/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
type LoginRes =
    paths["/api/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];

export async function login(body: LoginReq): Promise<LoginRes> {
    const data = await apiFetch<LoginRes>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
    });
    // assuming { token: string }
    if ("token" in data && typeof data.token === "string") {
        setToken(data.token);
    }
    return data;
}
