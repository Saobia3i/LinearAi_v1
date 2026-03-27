import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, getErrorMessage, login, logout, signup } from "../api";
import type { AuthUser } from "../types";

type LoginPayload = { email: string; password: string; rememberMe: boolean };
type SignupPayload = { fullName: string; email: string; password: string; confirmPassword: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  loginAction: (payload: LoginPayload) => Promise<void>;
  signupAction: (payload: SignupPayload) => Promise<string>;
  logoutAction: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshUser,
      loginAction: async (payload) => {
        await login(payload);
        await refreshUser();
      },
      signupAction: async (payload) => {
        const response = await signup(payload);
        return response.message ?? "Registration complete.";
      },
      logoutAction: async () => {
        try {
          await logout();
        } catch (error) {
          throw new Error(getErrorMessage(error, "Logout failed"));
        }
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
