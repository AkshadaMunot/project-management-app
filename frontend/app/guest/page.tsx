"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GuestPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    if (!name.trim() || !email.trim()) {
      alert("Please enter your name and email.");
      return;
    }

   localStorage.setItem(
  "user",
  JSON.stringify({
    name: name.trim(),
    email: email.trim(),
    accountType: "Guest",
    isAuthenticated: true,
  })
);

router.push("/tasks");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 text-lg font-semibold text-white">
            P
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">
            Continue as Guest
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter your details to continue to your workspace
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          {/* Continue */}
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-lg bg-slate-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Continue
          </button>

        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-5 w-full text-center text-sm text-slate-400 hover:text-slate-700"
        >
          Back to Login
        </button>

      </div>
    </main>
  );
}