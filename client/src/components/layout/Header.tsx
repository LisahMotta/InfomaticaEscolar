import { PlusCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateToLongPtBR } from "@/lib/utils/dateUtils";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  openAddScheduleModal: () => void;
}

export default function Header({ openAddScheduleModal }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, logoutMutation } = useAuth();

  useEffect(() => {
    // Update the date once per day at midnight
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now);
      }
    }, 60000); // check every minute
    
    return () => clearInterval(timer);
  }, [currentDate]);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Agenda da Sala de Informática
          </h1>
          <p className="text-sm text-gray-500">
            {formatDateToLongPtBR(currentDate)}
          </p>
        </div>
        <div className="flex items-center">
          {user && (user.role === 'proati' || user.role === 'teacher') && (
            <Button 
              variant="outline" 
              className="mr-2 flex items-center gap-1" 
              onClick={openAddScheduleModal}
            >
              <PlusCircle className="h-4 w-4" />
              Novo
            </Button>
          )}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" alt={user.displayName} />
                    <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                  </Avatar>
                  <span className="ml-2 hidden md:block">{user.displayName || 'Usuário'}</span>
                </div>
                <Link href="/logout">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 hover:text-red-500 flex items-center gap-1" 
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Sair</span>
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/auth" className="text-primary text-sm hover:underline">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
