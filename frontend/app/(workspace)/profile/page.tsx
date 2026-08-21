"use client";

import { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
  accountType?: string;
  isAuthenticated?: boolean;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);

        setUser(parsedUser);
        setName(parsedUser.name || "");
        setEmail(parsedUser.email || "");
      } catch {
        console.error("Invalid user data");
      }
    }
  }, []);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required.");
      return;
    }

    const updatedUser: User = {
      name: name.trim(),
      email: email.trim(),
      accountType: user?.accountType || "Guest",
      isAuthenticated: user?.isAuthenticated ?? true,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUser(updatedUser);
    setEditing(false);

    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-white p-8 transition-colors dark:bg-slate-950 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
          Profile
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Manage your profile information
        </p>
      </div>

      {/* Profile Card */}
      <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">

        {/* Profile Header */}
        <div className="flex items-center gap-5 border-b border-slate-100 pb-6 dark:border-slate-700">

          {/* Profile Avatar */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-2xl font-semibold text-white transition-colors">
            {(user?.name || "G").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              {user?.name || "Guest"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {user?.email || "guest@example.com"}
            </p>
          </div>

        </div>

        {/* Personal Information */}
        <div className="mt-6">

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Personal Information
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Full Name */}
            <div>

              <label className="text-xs font-medium text-slate-400">
                Full Name
              </label>

              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-[var(--accent)] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              ) : (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {user?.name || "Guest"}
                </div>
              )}

            </div>

            {/* Email */}
            <div>

              <label className="text-xs font-medium text-slate-400">
                Email Address
              </label>

              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-[var(--accent)] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              ) : (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {user?.email || "guest@example.com"}
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Account Information */}
        <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-700">

          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Account Information
          </h3>

          <div className="mt-4">

            <label className="text-xs font-medium text-slate-400">
              Account Type
            </label>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {user?.accountType || "Guest"}
            </div>

          </div>

        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-end gap-3">

          {editing ? (
            <>
              {/* Cancel */}
              <button
                type="button"
                onClick={() => {
                  setName(user?.name || "");
                  setEmail(user?.email || "");
                  setEditing(false);
                }}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Save Changes
              </button>
            </>
          ) : (
            /* Edit Profile */
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Edit Profile
            </button>
          )}

        </div>

      </div>

    </main>
  );
}