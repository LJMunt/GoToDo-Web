import type { paths } from "./schema";
import { apiFetch, getToken, setToken } from "./http";

// --- Types (derived from OpenAPI) ---
type LoginReq =
    paths["/api/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
type LoginRes =
    paths["/api/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];

type SignupReq =
    paths["/api/v1/auth/signup"]["post"]["requestBody"]["content"]["application/json"];
type SignupRes =
    paths["/api/v1/auth/signup"]["post"]["responses"]["201"]["content"]["application/json"];

type PasswordChangeReq =
    paths["/api/v1/auth/password-change"]["post"]["requestBody"]["content"]["application/json"];

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

export async function changePassword(body: PasswordChangeReq): Promise<void> {
    const token = getToken();
    if (!token) throw new Error("not authenticated");

    try {
        await apiFetch("/v1/auth/password-change", {
            method: "POST",
            body: JSON.stringify(body),
        });
    } catch (err: any) {
        // Only map "invalid credentials" which the backend returns for wrong current password
        if (err.message.toLowerCase().includes("invalid credentials")) {
            throw new Error("Incorrect current password");
        }
        // Surface "not authenticated" or other errors as is
        throw err;
    }
}
