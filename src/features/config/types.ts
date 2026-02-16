import type { components } from "../../api/schema";

export type ConfigKey = components["schemas"]["ConfigKey"];
export type ConfigTranslations = components["schemas"]["ConfigTranslations"]; 
export type ConfigValue = components["schemas"]["ConfigValue"] | string; 
export type ConfigValues = { [key: string]: ConfigValue };
export type ConfigStatus = components["schemas"]["ConfigStatus"];

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
    emailPlaceholder: string;
    passwordPlaceholder: string;
    signupPasswordPlaceholder: string;
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
    recurringTemplate: string;
    everyMonth: string;
    occurrences: string;
    createProjectTitle: string;
    createProjectSubtitle: string;
    projectNameLabel: string;
    projectNamePlaceholder: string;
    projectDescriptionLabel: string;
    projectDescriptionPlaceholder: string;
    createProjectButton: string;
    editProjectTitle: string;
    editProjectSubtitle: string;
    saveChangesButton: string;
    deleteProjectButton: string;
    deleteProjectConfirm: string;
    createTaskTitle: string;
    editTaskTitle: string;
    taskTitleLabel: string;
    taskTitlePlaceholder: string;
    taskDescriptionLabel: string;
    taskDescriptionPlaceholder: string;
    dueDateLabel: string;
    tagsLabel: string;
    addTagPlaceholder: string;
    addButton: string;
    repeatEveryLabel: string;
    frequencyLabel: string;
    dayUnit: string;
    weekUnit: string;
    monthUnit: string;
    recurringLabel: string;
    createTaskButton: string;
    deleteTaskButton: string;
    manageTagsTitle: string;
    manageTagsSubtitle: string;
    createNewTagPlaceholder: string;
    createButton: string;
    noTagsYet: string;
    editTagTitle: string;
    deleteTagTitle: string;
    loadingProjectDetails: string;
    loadingTags: string;
    taskTitleRequired: string;
    dueDateRequiredForRecurring: string;
    projectNameRequired: string;
    adminTip: string;
    userManagementTitle: string;
    userManagementSubtitle: string;
    systemOverviewSubtitle: string;
    databaseSizeDescription: string;
    activeConnectionsDescription: string;
    cacheHitRatioDescription: string;
    deadlocksDescription: string;
    blocksReadDescription: string;
    blocksHitDescription: string;
    updatePasswordButton: string;
    updatedSuccess: string;
    deleteAccountButton: string;
    deleteAccountTitle: string;
    deleteAccountPermanent: string;
    deleteAccountConfirmation: string;
    confirmPasswordLabel: string;
    enterPasswordPlaceholder: string;
    deleteAccountAgreement: string;
    noUsersFound: string;
    noUsersFoundDescription: string;
    cannotInactivateSelf: string;
    inactivateWarning: string;
    addLanguageTitle: string;
    addLanguageSubtitle: string;
    languageCodeLabel: string;
    displayNameLabel: string;
    addingLanguage: string;
    addLanguageButton: string;
    navigationTitle: string;
    noProjectsYet: string;
    singleTaskLabel: string;
    projectLabel: string;
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
        emailPlaceholder: "name@example.com",
        passwordPlaceholder: "••••••••",
        signupPasswordPlaceholder: "Min 8 characters",
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
        recurringTemplate: "Recurring Template",
        everyMonth: "Every 1 month",
        occurrences: "Occurences",
        createProjectTitle: "Create New Project",
        createProjectSubtitle: "Start something new",
        projectNameLabel: "Project Name",
        projectNamePlaceholder: "e.g. Personal Website",
        projectDescriptionLabel: "Description",
        projectDescriptionPlaceholder: "What is this project about?",
        createProjectButton: "Create Project",
        editProjectTitle: "Edit Project",
        editProjectSubtitle: "Workspace Settings",
        saveChangesButton: "Save Changes",
        deleteProjectButton: "Delete",
        deleteProjectConfirm: "Are you sure you want to delete this project? All tasks within will be lost.",
        createTaskTitle: "Create Task",
        editTaskTitle: "Edit Task",
        taskTitleLabel: "Title",
        taskTitlePlaceholder: "Task title",
        taskDescriptionLabel: "Description",
        taskDescriptionPlaceholder: "Add a description...",
        dueDateLabel: "Due Date",
        tagsLabel: "Tags",
        addTagPlaceholder: "Add tag...",
        addButton: "Add",
        repeatEveryLabel: "Repeat Every",
        frequencyLabel: "Frequency",
        dayUnit: "Day(s)",
        weekUnit: "Week(s)",
        monthUnit: "Month(s)",
        recurringLabel: "Recurring",
        createTaskButton: "Create Task",
        deleteTaskButton: "Delete",
        manageTagsTitle: "Manage Tags",
        manageTagsSubtitle: "Organize your workspace",
        createNewTagPlaceholder: "Create new tag...",
        createButton: "Create",
        noTagsYet: "No tags created yet.",
        editTagTitle: "Edit tag",
        deleteTagTitle: "Delete tag",
        loadingProjectDetails: "Loading project details...",
        loadingTags: "Loading tags...",
        taskTitleRequired: "Title is required",
        dueDateRequiredForRecurring: "Due date is required for recurring tasks",
        projectNameRequired: "Project name is required",
        adminTip: "Admin Tip",
        userManagementTitle: "User Management",
        userManagementSubtitle: "Manage all users in the system.",
        systemOverviewSubtitle: "System status and overview.",
        databaseSizeDescription: "Total size of the database on disk",
        activeConnectionsDescription: "Number of currently active database connections",
        cacheHitRatioDescription: "Percentage of disk blocks found in buffer cache",
        deadlocksDescription: "Total number of transaction conflicts detected",
        blocksReadDescription: "Total number of disk blocks read from storage",
        blocksHitDescription: "Total disk blocks found in buffer cache",
        updatePasswordButton: "Update Password",
        updatedSuccess: "Updated",
        deleteAccountButton: "Delete my Account",
        deleteAccountTitle: "Delete Account",
        deleteAccountPermanent: "This action is permanent",
        deleteAccountConfirmation: "Are you absolutely sure? All your projects, tasks, and data will be permanently deleted. This cannot be undone.",
        confirmPasswordLabel: "Confirm Password",
        enterPasswordPlaceholder: "Enter your password",
        deleteAccountAgreement: "I understand that my account and all associated data will be permanently removed.",
        noUsersFound: "No users found",
        noUsersFoundDescription: "Try adjusting your filters or search terms.",
        cannotInactivateSelf: "You cannot inactivate your own account.",
        inactivateWarning: "This will immediately log the user out and block future logins.",
        addLanguageTitle: "Add Language",
        addLanguageSubtitle: "Create a new localization",
        languageCodeLabel: "Language Code (e.g. en, pt-br)",
        displayNameLabel: "Display Name",
        addingLanguage: "Adding...",
        addLanguageButton: "Add",
        navigationTitle: "Navigation",
        noProjectsYet: "No projects yet.",
        singleTaskLabel: "Single Task",
        projectLabel: "Project",
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
