import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RoleRoute({ children, allow }: { children: ReactElement; allow: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="section-subtitle">Loading permissions...</p>;
  }

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
