"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function Home() {
  const router = useRouter();

  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [googleReady, setGoogleReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = async (response: any) => {
    if (!response?.credential) {
      alert("Google sign-in failed.");
      return;
    }

    try {
      setLoading(true);

      const backendResponse = await fetch(
        `${API_URL}/auth/google`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            credential: response.credential,
          }),
        }
      );

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(
          data?.message || "Google authentication failed"
        );
      }

      /*
       * IMPORTANT:
       * Backend response मध्ये isAuthenticated नसले तरी
       * frontend auth state साठी ते manually true ठेवत आहोत.
       */
      const authenticatedUser = {
        ...data,
        isAuthenticated: true,
        accountType: "Google",
      };

      localStorage.setItem(
        "user",
        JSON.stringify(authenticatedUser)
      );

      // Small delay so localStorage is definitely updated
      router.replace("/tasks");
    } catch (error) {
      console.error("Google sign-in error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Google sign-in failed."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !googleReady ||
      !window.google ||
      !googleButtonRef.current ||
      !GOOGLE_CLIENT_ID
    ) {
      return;
    }

    googleButtonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
    });

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        theme: "outline",
        size: "large",
        width: 350,
        text: "signin_with",
        shape: "rectangular",
      }
    );
  }, [googleReady]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
         onReady={() => {
          setGoogleReady(true);
        }}
      />

      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">

          {/* Logo */}
          <div className="mb-7 flex items-center justify-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800">
              <span className="text-sm font-bold text-white">
                P
              </span>
            </div>

            <span className="text-sm font-semibold text-slate-800">
              Pyramid
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[22px] font-semibold leading-7 text-slate-800">
            Let&apos;s get back on track
          </h1>

          {/* Description */}
          <p className="mt-1.5 text-sm leading-5 text-slate-400">
            Enter your email below to login to your account.
          </p>

          {/* Guest Login */}
          <button
            type="button"
            onClick={() => router.push("/guest")}
            className="mt-6 w-full rounded-full bg-slate-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 active:scale-[0.99]"
          >
            Continue as Guest
          </button>

          {/* Google Sign In */}
          <div className="mt-5 flex min-h-[44px] justify-center">
            {GOOGLE_CLIENT_ID ? (
              <div ref={googleButtonRef} />
            ) : (
              <p className="text-xs text-red-500">
                Google Client ID is not configured.
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <p className="mt-3 text-xs text-slate-400">
              Signing in with Google...
            </p>
          )}

          {/* Terms */}
          <p className="mx-auto mt-9 max-w-[300px] text-[11px] leading-4 text-slate-400">
            By clicking continue, you agree to our{" "}
            <span className="underline">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline">
              Privacy Policy
            </span>
            .
          </p>

        </div>
      </main>
    </>
  );
}