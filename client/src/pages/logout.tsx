import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Redirect } from "wouter";

export default function LogoutPage() {
  const { logoutMutation } = useAuth();

  useEffect(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {logoutMutation.isPending ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Saindo da sua conta...</p>
        </>
      ) : (
        <Redirect to="/auth" />
      )}
    </div>
  );
}