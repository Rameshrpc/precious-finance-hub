import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { checkRouteAccess } from "@/lib/role-access";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If specific roles are required, check them
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = roles.some((r) => requiredRoles.includes(r)) || roles.includes("super_admin");
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Also check route-based access
  if (!checkRouteAccess(location.pathname, roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
