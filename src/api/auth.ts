import type { paths } from "./schema";
import { apiFetch, getToken, setToken } from "./http";

// --- Types (derived from OpenAPI) ---
type LoginReq =
    paths["/api/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
type LoginRes =
    paths["/api/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];

type MfaTotpReq =
    paths["/api/v1/auth/mfa/totp"]["post"]["requestBody"]["content"]["application/json"];
type MfaTotpRes =
    paths["/api/v1/auth/mfa/totp"]["post"]["responses"]["200"]["content"]["application/json"];

type MfaTotpStartRes =
    paths["/api/v1/mfa/totp/start"]["post"]["responses"]["200"]["content"]["application/json"];

type MfaTotpConfirmReq =
    paths["/api/v1/mfa/totp/confirm"]["post"]["requestBody"]["content"]["application/json"];
type MfaTotpConfirmRes =
    paths["/api/v1/mfa/totp/confirm"]["post"]["responses"]["200"]["content"]["application/json"];

type SignupReq =
    paths["/api/v1/auth/signup"]["post"]["requestBody"]["content"]["application/json"];
type SignupRes =
    paths["/api/v1/auth/signup"]["post"]["responses"]["201"]["content"]["application/json"];

type PasswordChangeReq =
    paths["/api/v1/auth/password-change"]["post"]["requestBody"]["content"]["application/json"];

type VerifyEmailReq =
    paths["/api/v1/auth/verify-email"]["post"]["requestBody"]["content"]["application/json"];
type VerifyEmailRes =
    paths["/api/v1/auth/verify-email"]["post"]["responses"]["200"]["content"]["application/json"];

type ResendVerificationReq =
    paths["/api/v1/auth/verify-email/resend"]["post"]["requestBody"]["content"]["application/json"];

type RequestPasswordResetReq =
    paths["/api/v1/auth/password-reset/request"]["post"]["requestBody"]["content"]["application/json"];

type ValidatePasswordResetReq =
    paths["/api/v1/auth/password-reset/validate"]["post"]["requestBody"]["content"]["application/json"];
type ValidatePasswordResetRes =
    paths["/api/v1/auth/password-reset/validate"]["post"]["responses"]["200"]["content"]["application/json"];

type ConfirmPasswordResetReq =
    paths["/api/v1/auth/password-reset/confirm"]["post"]["requestBody"]["content"]["application/json"];
type ConfirmPasswordResetRes =
    paths["/api/v1/auth/password-reset/confirm"]["post"]["responses"]["200"]["content"]["application/json"];

// --- API functions ---
export async function login(body: LoginReq): Promise<LoginRes> {
    const data = await apiFetch<LoginRes>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
    });

    if (!data.mfa_required) {
        setToken(data.token ?? null);
    }
    return data;
}

export async function verifyMfaTotp(body: MfaTotpReq): Promise<MfaTotpRes> {
    const data = await apiFetch<MfaTotpRes>("/v1/auth/mfa/totp", {
        method: "POST",
        body: JSON.stringify(body),
    });

    setToken(data.token ?? null);
    return data;
}

export async function mfaTotpStart(): Promise<MfaTotpStartRes> {
    return apiFetch<MfaTotpStartRes>("/v1/mfa/totp/start", {
        method: "POST",
    });
}

export async function mfaTotpConfirm(body: MfaTotpConfirmReq): Promise<MfaTotpConfirmRes> {
    return apiFetch<MfaTotpConfirmRes>("/v1/mfa/totp/confirm", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function mfaTotpDisable(): Promise<void> {
    await apiFetch("/v1/mfa/totp/disable", {
        method: "POST",
    });
}

export async function signup(body: SignupReq): Promise<SignupRes> {
    const data = await apiFetch<SignupRes>("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(body),
    });

    // Store token only if backend issues one (may be absent when verification is required)
    if (data.token) setToken(data.token);
    else setToken(null);
    return data;
}

export async function logout(): Promise<void> {
    try {
        await apiFetch("/v1/auth/logout", { method: "POST" });
    } catch {
        // Ignore errors on logout – we still clear the token locally
    } finally {
        setToken(null);
    }
}

export async function changePassword(body: PasswordChangeReq): Promise<void> {
    const token = getToken();
    if (!token) throw new Error("not authenticated");

    try {
        await apiFetch("/v1/auth/password-change", {
            method: "POST",
            body: JSON.stringify(body),
        });
    } catch (err: unknown) {
        // Only map "invalid credentials" which the backend returns for wrong current password
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("invalid credentials")) {
            throw new Error("Incorrect current password");
        }
        // Surface "not authenticated" or other errors as is
        throw err;
    }
}

export async function verifyEmail(token: VerifyEmailReq["token"]): Promise<VerifyEmailRes> {
    const data = await apiFetch<VerifyEmailRes>("/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
    });

    setToken(data.token ?? null);
    return data;
}

export function resendVerificationEmail(email: ResendVerificationReq["email"]): Promise<void> {
    return apiFetch<void>("/v1/auth/verify-email/resend", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export function requestPasswordReset(body: RequestPasswordResetReq): Promise<void> {
    return apiFetch<void>("/v1/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function validatePasswordResetToken(body: ValidatePasswordResetReq): Promise<ValidatePasswordResetRes> {
    return apiFetch<ValidatePasswordResetRes>("/v1/auth/password-reset/validate", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function confirmPasswordReset(body: ConfirmPasswordResetReq): Promise<ConfirmPasswordResetRes> {
    const data = await apiFetch<ConfirmPasswordResetRes>("/v1/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify(body),
    });

    return data;
}
