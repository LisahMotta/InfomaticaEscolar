import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Shield } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AccessDenied() {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Acesso Negado</h1>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
          
          <p className="text-sm text-gray-500">
            {user?.role === 'teacher' && 'Como professor, você só pode visualizar e gerenciar agendamentos da sua turma.'}
            {user?.role === 'coordinator' && 'Como coordenador, você tem acesso apenas para visualização.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button asChild className="w-full" variant="outline">
            <Link href="/">Voltar ao Início</Link>
          </Button>
          <Button className="w-full" onClick={handleLogout} variant="destructive">
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}