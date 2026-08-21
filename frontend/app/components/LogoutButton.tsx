"use client";

import { useAuth } from "../hooks/useAuth";

export default function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      Logout
    </button>
  );
}