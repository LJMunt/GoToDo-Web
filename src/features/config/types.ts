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
    emailLabel: string;
    passwordLabel: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    signInButton: string;
    signUpButton: string;
    creatingAccount: string;
    signingIn: string;
    noAccountPrompt: string;
    createOneLink: string;
    alreadyHaveAccountPrompt: string;
    signInLink: string;
}

export interface UIConfig {
    agendaTitle: string;
    agendaEmptyStateTitle: string;
    agendaEmptyStateText: string;
    today: string;
    showCompleted: string;
    itemsCount: string;
    noTasksFound: string;
    noDueDate: string;
    projectEmptyStateText: string;
    searchPlaceholder: string;
    loading: string;
    errorPrefix: string;
    saveChanges: string;
    reset: string;
    saving: string;
    actions: string;
    cancel: string;
    confirm: string;
    active: string;
    inactive: string;
    status: string;
    role: string;
    lastLogin: string;
    neverLoggedIn: string;
    id: string;
    email: string;
    allRoles: string;
    adminsOnly: string;
    usersOnly: string;
    allStatus: string;
    changeUserStatus: string;
    you: string;
    adminRole: string;
    userRole: string;
    never: string;
    systemStatus: string;
    systemInformation: string;
    backendHealth: string;
    dbReady: string;
    webVersion: string;
    backendVersion: string;
    totalUsers: string;
    databaseMetrics: string;
    databaseSize: string;
    activeConnections: string;
    cacheHitRatio: string;
    deadlocks: string;
    blocksRead: string;
    blocksHit: string;
    passwordSecurity: string;
    atLeast8Chars: string;
    uppercaseLetter: string;
    lowercaseLetter: string;
    numberRequirement: string;
    specialCharRequirement: string;
    appTheme: string;
    themeDescription: string;
    completedTasks: string;
    completedTasksDescription: string;
    language: string;
    languageDescription: string;
    account: string;
    preferences: string;
    security: string;
    edit: string;
    save: string;
    settingsTitle: string;
    settingsSubtitle: string;
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
    userData: string;
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
        emailLabel: "Email Address",
        passwordLabel: "Password",
        currentPasswordLabel: "Current Password",
        newPasswordLabel: "New Password",
        signInButton: "Sign in",
        signUpButton: "Create account",
        creatingAccount: "Creating account...",
        signingIn: "Signing in...",
        noAccountPrompt: "Don't have an account?",
        createOneLink: "Create one",
        alreadyHaveAccountPrompt: "Already have an account?",
        signInLink: "Sign in",
    },
    ui: {
        agendaTitle: "Your Agenda",
        agendaEmptyStateTitle: "All caught up!",
        agendaEmptyStateText: "Your agenda for today is empty. Time to relax or plan ahead.",
        today: "Today",
        showCompleted: "Show completed",
        itemsCount: "items",
        noTasksFound: "No tasks found",
        noDueDate: "No due date",
        projectEmptyStateText: "This project is currently empty. Start by adding a task.",
        searchPlaceholder: "Search...",
        loading: "Loading...",
        errorPrefix: "Error",
        saveChanges: "Save Changes",
        reset: "Reset",
        saving: "Saving...",
        actions: "Actions",
        cancel: "Cancel",
        confirm: "Confirm",
        active: "Active",
        inactive: "Inactive",
        status: "Status",
        role: "Role",
        lastLogin: "Last Login",
        neverLoggedIn: "Never logged in",
        id: "ID",
        email: "Email",
        allRoles: "All Roles",
        adminsOnly: "Admins Only",
        usersOnly: "Users Only",
        allStatus: "All Status",
        changeUserStatus: "Change User Status",
        you: "You",
        adminRole: "Admin",
        userRole: "User",
        never: "Never",
        systemStatus: "System Status",
        systemInformation: "System Information",
        backendHealth: "Backend Health",
        dbReady: "DB Ready",
        webVersion: "Web Version",
        backendVersion: "Backend Version",
        totalUsers: "Total Users",
        databaseMetrics: "Database Metrics",
        databaseSize: "Database Size",
        activeConnections: "Active Connections",
        cacheHitRatio: "Cache Hit Ratio",
        deadlocks: "Deadlocks",
        blocksRead: "Blocks Read",
        blocksHit: "Blocks Hit",
        passwordSecurity: "Password Security",
        atLeast8Chars: "At least 8 characters",
        uppercaseLetter: "Uppercase letter",
        lowercaseLetter: "Lowercase letter",
        numberRequirement: "Number",
        specialCharRequirement: "Special character",
        appTheme: "App Theme",
        themeDescription: "Personalize your workspace with a theme that fits your flow.",
        completedTasks: "Completed Tasks",
        completedTasksDescription: "Automatically show completed tasks in your projects by default.",
        language: "Language",
        languageDescription: "Choose your preferred language for the interface.",
        account: "Account",
        preferences: "Preferences",
        security: "Security",
        edit: "Edit",
        save: "Save",
        settingsTitle: "Settings",
        settingsSubtitle: "Manage your workspace and security.",
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
        userData: "User Data",
    }
};
