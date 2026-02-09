import type { components } from "../../api/schema";

export type ConfigKey = components["schemas"]["ConfigKey"];
export type ConfigTranslations = components["schemas"]["ConfigTranslations"];

export interface BrandingConfig {
    appName: string;
    appLogoInitial: string;
    supportEmail: string;
}

export interface AuthConfig {
    loginTitle: string;
    loginSubtitle: string;
    signupTitle: string;
    signupSubtitle: string;
}

export interface UIConfig {
    agendaTitle: string;
    agendaEmptyStateTitle: string;
    agendaEmptyStateText: string;
}

export interface NavigationConfig {
    agenda: string;
    projects: string;
    dashboard: string;
    users: string;
    configuration: string;
    jobs: string;
    userSettings: string;
    administration: string;
    support: string;
    logout: string;
}

export interface AppConfig {
    branding: BrandingConfig;
    auth: AuthConfig;
    ui: UIConfig;
    navigation: NavigationConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
    branding: {
        appName: "Gotodo",
        appLogoInitial: "G",
        supportEmail: "support@todexia.app",
    },
    auth: {
        loginTitle: "Welcome back",
        loginSubtitle: "Step back into your agenda.",
        signupTitle: "Create account",
        signupSubtitle: "Spin up a workspace that belongs to you.",
    },
    ui: {
        agendaTitle: "Your Agenda",
        agendaEmptyStateTitle: "All caught up!",
        agendaEmptyStateText: "Your agenda for today is empty. Time to relax or plan ahead.",
    },
    navigation: {
        agenda: "Agenda",
        projects: "Projects",
        dashboard: "Dashboard",
        users: "Users",
        configuration: "Configuration",
        jobs: "Jobs",
        userSettings: "User Settings",
        administration: "Administration",
        support: "Support",
        logout: "Log out",
    }
};
