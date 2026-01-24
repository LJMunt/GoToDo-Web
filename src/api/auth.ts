import type { paths } from "./schema";
import { apiFetch, setToken } from "./http";

// --- Types (derived from OpenAPI) ---
type LoginReq =
    paths["/api/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
type LoginRes =
    paths["/api/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];

type SignupReq =
    paths["/api/v1/auth/signup"]["post"]["requestBody"]["content"]["application/json"];
type SignupRes =
    paths["/api/v1/auth/signup"]["post"]["responses"]["201"]["content"]["application/json"];

// --- API functions ---
export async function login(body: LoginReq): Promise<LoginRes> {
    const data = await apiFetch<LoginRes>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
    });

    setToken(data.token ?? null);
    return data;
}

export async function signup(body: SignupReq): Promise<SignupRes> {
    const data = await apiFetch<SignupRes>("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(body),
    });

    // Your signup returns token too — perfect UX
    setToken(data.token ?? null);
    return data;
}

export function logout() {
    setToken(null);
}
