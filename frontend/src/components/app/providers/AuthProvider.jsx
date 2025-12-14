// frontend/src/components/app/providers/AuthProvider.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/components/api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const me = await api.auth.me();

        if (cancelled) return;

        setUser(me);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("[AuthProvider] /auth/me failed:", err);

        if (cancelled) return;

        // 🔒 IMPORTANT:
        // Only mark unauthenticated if backend explicitly says so
        if (err?.status === 401 || err?.status === 403) {
          setUser(null);
          setIsAuthenticated(false);
        }
        // Otherwise (404, 500, network issues) DO NOT log user out
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setIsAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
