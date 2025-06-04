import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import LogoutPage from "@/pages/logout";
import DownloadApp from "@/pages/download-app";
import AccessDenied from "@/pages/access-denied";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@shared/schema";

function Router() {
  return (
    <Switch>
      {/* Rota para autenticação */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Rota para logout */}
      <Route path="/logout" component={LogoutPage} />
      
      {/* Rota de acesso negado */}
      <Route path="/acesso-negado" component={AccessDenied} />

      {/* Rotas protegidas - apenas usuários autenticados */}
      <ProtectedRoute path="/" component={Dashboard} />
      
      {/* Rotas protegidas - acesso por role */}
      <ProtectedRoute 
        path="/calendar" 
        component={Calendar} 
        allowedRoles={[UserRole.PROATI, UserRole.TEACHER]} 
      />
      
      <ProtectedRoute path="/notifications" component={Notifications} />
      
      <ProtectedRoute 
        path="/settings" 
        component={Settings} 
        allowedRoles={[UserRole.PROATI]} 
      />
      
      <ProtectedRoute path="/app" component={DownloadApp} />
      
      {/* Rota 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
