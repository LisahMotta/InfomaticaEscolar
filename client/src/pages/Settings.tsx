import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import UserRegistrationForm from "@/components/settings/UserRegistrationForm";
import UsersList from "@/components/settings/UsersList";
import { Redirect } from "wouter";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showCompletedClasses, setShowCompletedClasses] = useState(true);
  const [autoDeletePastSchedules, setAutoDeletePastSchedules] = useState(false);
  const [deleteAfterDays, setDeleteAfterDays] = useState(30);
  
  // Verificar se o usuário está autenticado
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram salvas com sucesso.",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="md:ml-64 flex-1">
        <Header openAddScheduleModal={() => {}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500">Gerenciar suas preferências do sistema</p>
            </div>
            
            <Tabs defaultValue="general">
              <div className="px-6 pt-4">
                <TabsList>
                  <TabsTrigger value="general">Geral</TabsTrigger>
                  <TabsTrigger value="notifications">Notificações</TabsTrigger>
                  <TabsTrigger value="data">Dados</TabsTrigger>
                  {user.role === UserRole.PROATI && (
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                  )}
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações Gerais</CardTitle>
                      <CardDescription>
                        Gerenciar as configurações básicas da aplicação.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show-completed" className="text-base">Mostrar aulas concluídas</Label>
                          <p className="text-sm text-gray-500">
                            Exibir aulas que já foram realizadas na agenda
                          </p>
                        </div>
                        <Switch 
                          id="show-completed" 
                          checked={showCompletedClasses}
                          onCheckedChange={setShowCompletedClasses}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <Label htmlFor="default-view" className="text-base">Visualização padrão</Label>
                          <p className="text-sm text-gray-500">
                            Escolha a visualização padrão ao abrir a agenda
                          </p>
                        </div>
                        <select 
                          id="default-view" 
                          className="block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm"
                        >
                          <option value="day">Diária</option>
                          <option value="week">Semanal</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferências de Notificações</CardTitle>
                      <CardDescription>
                        Controle como você recebe lembretes de aulas agendadas.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="notifications-enabled" className="text-base">Ativar notificações</Label>
                          <p className="text-sm text-gray-500">
                            Receber alertas sobre as próximas aulas
                          </p>
                        </div>
                        <Switch 
                          id="notifications-enabled" 
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <Label htmlFor="email-notifications" className="text-base">Notificações por e-mail</Label>
                          <p className="text-sm text-gray-500">
                            Receber lembretes por e-mail
                          </p>
                        </div>
                        <Switch 
                          id="email-notifications" 
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                          disabled={!notificationsEnabled}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <Label htmlFor="notification-time" className="text-base">Tempo do lembrete</Label>
                          <p className="text-sm text-gray-500">
                            Quando você deseja ser notificado antes da aula
                          </p>
                        </div>
                        <select 
                          id="notification-time" 
                          className="block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm"
                          disabled={!notificationsEnabled}
                        >
                          <option value="15">15 minutos antes</option>
                          <option value="30">30 minutos antes</option>
                          <option value="60">1 hora antes</option>
                          <option value="day">1 dia antes</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="data">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gerenciamento de Dados</CardTitle>
                      <CardDescription>
                        Controle como os dados da agenda são mantidos.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-delete" className="text-base">Excluir agendamentos antigos</Label>
                          <p className="text-sm text-gray-500">
                            Remover automaticamente agendamentos passados
                          </p>
                        </div>
                        <Switch 
                          id="auto-delete" 
                          checked={autoDeletePastSchedules}
                          onCheckedChange={setAutoDeletePastSchedules}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <Label htmlFor="delete-after" className="text-base">Excluir após</Label>
                          <p className="text-sm text-gray-500">
                            Período após o qual os agendamentos serão excluídos
                          </p>
                        </div>
                        <select 
                          id="delete-after" 
                          className="block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm"
                          disabled={!autoDeletePastSchedules}
                          value={deleteAfterDays}
                          onChange={(e) => setDeleteAfterDays(Number(e.target.value))}
                        >
                          <option value="7">7 dias</option>
                          <option value="14">14 dias</option>
                          <option value="30">30 dias</option>
                          <option value="90">90 dias</option>
                        </select>
                      </div>
                      
                      <div className="pt-4">
                        <Button variant="destructive" className="mr-2">
                          Limpar Todos os Dados
                        </Button>
                        <Button variant="outline">
                          Exportar Dados
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {user.role === UserRole.PROATI && (
                  <TabsContent value="users">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="lg:col-span-1 space-y-6">
                        <UserRegistrationForm />
                      </div>
                      <div className="lg:col-span-1">
                        <UsersList />
                      </div>
                    </div>
                  </TabsContent>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <Button variant="outline" className="mr-2">
                  Cancelar
                </Button>
                <Button onClick={handleSaveSettings}>
                  Salvar Configurações
                </Button>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
