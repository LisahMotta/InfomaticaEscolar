import { Link, useLocation } from "wouter";
import { 
  List, 
  PlusCircle, 
  Bell, 
  Settings,
  LogOut,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES, UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  notificationCount?: number;
}

export default function Sidebar({ notificationCount = 0 }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  return (
    <aside className="bg-white border-r border-gray-200 w-full md:w-64 md:flex-shrink-0 md:fixed md:h-screen overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary">Sala de Informática</h1>
        <p className="text-sm text-gray-500">Sistema de Controle</p>
      </div>

      <nav className="p-2">
        <div className="mb-4">
          <h2 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Principal
          </h2>
          <Link href="/">
            <div className={cn(
              "flex items-center px-2 py-2 rounded-md mb-1 font-medium cursor-pointer",
              isActive("/") 
                ? "text-primary bg-blue-50" 
                : "text-gray-600 hover:bg-gray-100"
            )}>
              <span className="mr-3">
                <List className="h-5 w-5" />
              </span>
              Agenda
            </div>
          </Link>
          <Link href="/calendar">
            <div className={cn(
              "flex items-center px-2 py-2 rounded-md mb-1 font-medium cursor-pointer",
              isActive("/calendar") 
                ? "text-primary bg-blue-50" 
                : "text-gray-600 hover:bg-gray-100"
            )}>
              <span className="mr-3">
                <PlusCircle className="h-5 w-5" />
              </span>
              Novo Agendamento
            </div>
          </Link>
          <Link href="/notifications">
            <div className={cn(
              "flex items-center px-2 py-2 rounded-md mb-1 font-medium cursor-pointer",
              isActive("/notifications") 
                ? "text-primary bg-blue-50" 
                : "text-gray-600 hover:bg-gray-100"
            )}>
              <span className="mr-3">
                <Bell className="h-5 w-5" />
              </span>
              Notificações
              {notificationCount > 0 && (
                <span className="ml-auto bg-primary text-white text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </div>
          </Link>
        </div>

        <div className="mb-4">
          <h2 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filtrar por Ano
          </h2>
          {/* Anos Iniciais (Período da Tarde) */}
          <h3 className="px-2 mb-1 text-xs text-gray-400 mt-2">Anos Iniciais (Tarde)</h3>
          <Link href="/?grade=1">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-grade1-light hover:text-grade1 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-grade1 mr-3"></span>
              {GRADES.FIRST.name}
            </div>
          </Link>
          <Link href="/?grade=2">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-grade2-light hover:text-grade2 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-grade2 mr-3"></span>
              {GRADES.SECOND.name}
            </div>
          </Link>
          <Link href="/?grade=3">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-grade3-light hover:text-grade3 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-grade3 mr-3"></span>
              {GRADES.THIRD.name}
            </div>
          </Link>
          <Link href="/?grade=4">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-grade4-light hover:text-grade4 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-grade4 mr-3"></span>
              {GRADES.FOURTH.name}
            </div>
          </Link>
          <Link href="/?grade=5">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-grade5-light hover:text-grade5 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-grade5 mr-3"></span>
              {GRADES.FIFTH.name}
            </div>
          </Link>
          
          {/* Anos Finais (Período da Manhã) */}
          <h3 className="px-2 mb-1 text-xs text-gray-400 mt-3">Anos Finais (Manhã)</h3>
          <Link href="/?grade=6">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-blue-600 mr-3"></span>
              {GRADES.SIXTH.name}
            </div>
          </Link>
          <Link href="/?grade=7">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-cyan-50 hover:text-cyan-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-cyan-600 mr-3"></span>
              {GRADES.SEVENTH.name}
            </div>
          </Link>
          <Link href="/?grade=8">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-teal-600 mr-3"></span>
              {GRADES.EIGHTH.name}
            </div>
          </Link>
          <Link href="/?grade=9">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-sky-600 mr-3"></span>
              {GRADES.NINTH.name}
            </div>
          </Link>
          <Link href="/?grade=10">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-indigo-600 mr-3"></span>
              {GRADES.FIRST_HS_MORNING.name}
            </div>
          </Link>
          
          {/* Ensino Médio (Período Noturno) */}
          <h3 className="px-2 mb-1 text-xs text-gray-400 mt-3">Ensino Médio (Noite)</h3>
          <Link href="/?grade=11">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-purple-600 mr-3"></span>
              {GRADES.FIRST_HS_NIGHT.name}
            </div>
          </Link>
          <Link href="/?grade=12">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-fuchsia-50 hover:text-fuchsia-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-fuchsia-600 mr-3"></span>
              {GRADES.SECOND_HS.name}
            </div>
          </Link>
          <Link href="/?grade=13">
            <div className="flex items-center px-2 py-2 text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded-md mb-1 cursor-pointer">
              <span className="w-3 h-3 rounded-full bg-pink-600 mr-3"></span>
              {GRADES.THIRD_HS.name}
            </div>
          </Link>
        </div>

        <div className="mb-4">
          <h2 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Configurações
          </h2>
          <Link href="/app">
            <div className={cn(
              "flex items-center px-2 py-2 rounded-md mb-1 font-medium cursor-pointer",
              isActive("/app") 
                ? "text-primary bg-blue-50" 
                : "text-gray-600 hover:bg-gray-100"
            )}>
              <span className="mr-3">
                <Smartphone className="h-5 w-5" />
              </span>
              Aplicativo Móvel
            </div>
          </Link>

          <Link href="/settings">
            <div className={cn(
              "flex items-center px-2 py-2 rounded-md mb-1 font-medium cursor-pointer",
              isActive("/settings") 
                ? "text-primary bg-blue-50" 
                : "text-gray-600 hover:bg-gray-100"
            )}>
              <span className="mr-3">
                <Settings className="h-5 w-5" />
              </span>
              Configurações
            </div>
          </Link>
        </div>

        {user && (
          <div className="mt-auto mb-4 pt-4 border-t border-gray-200">
            <div className="px-4 mb-2">
              <p className="font-medium">{user.displayName}</p>
              <p className="text-xs text-gray-500">
                {user.role === "proati" && "Administrador"}
                {user.role === "teacher" && `Professor - Turma ${user.assignedClass}`}
                {user.role === "coordinator" && "Coordenador Pedagógico"}
              </p>
            </div>
            <div className="px-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
