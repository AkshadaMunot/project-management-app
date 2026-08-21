"use client";

import { useEffect, useState } from "react";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  picture?: string;
  accountType: string;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      if (
        parsedUser &&
        parsedUser.isAuthenticated === true &&
        parsedUser.name &&
        parsedUser.email
      ) {
        setUser(parsedUser);
      } else {
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (error) {
      console.error("Authentication error:", error);

      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    // Remove logged-in user
    localStorage.removeItem("user");

    // Full reload of login page.
    // This makes Google Sign-In initialize again.
    window.location.href = "/";
  };

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    logout,
  };
}