import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  allowedRoles?: UserRole[];
  component: React.ComponentType;
};

export function ProtectedRoute({
  path,
  allowedRoles,
  component: Component,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
          return <Redirect to="/acesso-negado" />;
        }

        return <Component />;
      }}
    </Route>
  );
}