"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type User = {
  name: string;
  email: string;
  accountType?: string;
  isAuthenticated?: boolean;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const displayName = user?.name || "Guest";
  const displayEmail = user?.email || "guest@example.com";
  const initial = displayName.charAt(0).toUpperCase();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.replace("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

      {/* PROFILE */}
      <Link href="/profile">
        <div className="border-b border-slate-100 p-6 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
              {initial}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {displayName}
              </p>

              <p className="truncate text-xs text-slate-400">
                {displayEmail}
              </p>
            </div>

          </div>
        </div>
      </Link>

      {/* WORKSPACE */}
      <div className="p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Workspace
        </p>

        <nav className="space-y-2">

          <Link
            href="/tasks"
            className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              isActive("/tasks")
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            Tasks
          </Link>

          <Link
            href="/projects"
            className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              isActive("/projects")
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            Projects
          </Link>

        </nav>
      </div>

      {/* BOTTOM */}
      <div className="mt-auto border-t border-slate-100 p-5 dark:border-slate-700">

        <ThemeToggle />

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          Logout
        </button>

      </div>
    </aside>
  );
}