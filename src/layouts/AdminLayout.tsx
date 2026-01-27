import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
    const navItems = [
        { label: "Dashboard", to: "/admin", end: true },
        { label: "Users", to: "/admin/users" },
        { label: "Configuration", to: "/admin/config" },
        { label: "Jobs", to: "/admin/jobs" },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 flex-shrink-0">
                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                    isActive
                                        ? "bg-brand-500/10 text-brand-500"
                                        : "text-text-muted hover:bg-surface-5 hover:text-text-base"
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}
