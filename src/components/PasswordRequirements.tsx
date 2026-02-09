import { useMemo } from "react";
import { useConfig } from "../features/config/ConfigContext";

interface Requirement {
    label: string;
    met: boolean;
}

export function PasswordRequirements({ password }: { password: string }) {
    const { config } = useConfig();
    const requirements = useMemo<Requirement[]>(() => [
        { label: config.ui.atLeast8Chars, met: password.length >= 8 },
        { label: config.ui.uppercaseLetter, met: /[A-Z]/.test(password) },
        { label: config.ui.lowercaseLetter, met: /[a-z]/.test(password) },
        { label: config.ui.numberRequirement, met: /[0-9]/.test(password) },
        { label: config.ui.specialCharRequirement, met: /[^A-Za-z0-9]/.test(password) },
    ], [password, config.ui]);

    if (!password) return null;

    return (
        <div className="mt-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 ml-1">{config.ui.passwordSecurity}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2.5">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-500 ${req.met ? "bg-green-500/20 border-green-500/50 text-green-500" : "bg-surface-10 border-surface-15 text-text-muted/30"}`}>
                            {req.met ? (
                                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                                <div className="h-1 w-1 rounded-full bg-current" />
                            )}
                        </div>
                        <span className={`text-[11px] font-bold transition-colors duration-500 ${req.met ? "text-text-base" : "text-text-muted"}`}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
