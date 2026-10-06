import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/auth";
import type { Role } from "../types/auth";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, ready } = useAuth();

  if (!ready) return <div role="status" className="p-8 text-center">Validando sesión…</div>;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;