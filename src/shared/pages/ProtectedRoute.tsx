import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/auth";
import type { Role } from "../types/auth";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div role="status" className="p-8 text-center">Validando sesión…</div>;

  if (!isAuthenticated || !user) {
    return <Navigate to={location.pathname.startsWith('/preparacion') ? '/preparacion/login' : '/login'} replace />;
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
