import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="border-b border-slate-800">
                <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="font-semibold tracking-tight">
                        GoTodo
                    </Link>

                    <Link
                        to="/login"
                        className="text-sm text-slate-300 hover:text-slate-100"
                    >
                        Login
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}
