import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Download, Smartphone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Redirect } from "wouter";

export default function DownloadApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("app");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { 
    isSubscribed, 
    isSubscribing,
    permissionState,
    subscribeToNotifications, 
    unsubscribeFromNotifications 
  } = usePushNotifications();

  // Verificar se o app já está instalado ou se é uma PWA standalone
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }
  }, []);

  // Capturar evento beforeinstallprompt para implementar botão de instalação personalizado
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir o comportamento padrão do Chrome 67 e anteriores
      e.preventDefault();
      // Armazenar o evento para uso posterior
      setDeferredPrompt(e);
      console.log('Evento beforeinstallprompt capturado e armazenado');
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      console.log('Aplicativo instalado com sucesso via evento appinstalled');
      toast({
        title: "Aplicativo instalado!",
        description: "O aplicativo foi instalado com sucesso no seu dispositivo.",
        variant: "default",
      });
    };

    // Verificar se já existe um evento deferredPrompt armazenado globalmente
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      console.log('Recuperado evento deferredPrompt previamente armazenado');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    console.log('Botão de instalação clicado, deferredPrompt:', deferredPrompt);
    
    if (!deferredPrompt) {
      // Em caso de navegadores sem suporte, desktop, ou já instalado
      toast({
        title: "Instalação via navegador",
        description: "No menu do seu navegador, selecione 'Adicionar à tela inicial' ou 'Instalar aplicativo'",
        variant: "default",
      });
      
      // Instruções específicas para diferentes navegadores
      const ua = navigator.userAgent;
      
      if (ua.includes('Chrome') || ua.includes('Chromium')) {
        console.log('Detectado Chrome/Chromium: instruções para menu');
        // O Chrome tem um menu específico para instalação
      } else if (ua.includes('Firefox')) {
        console.log('Detectado Firefox: instalação via menu de página');
        // Firefox tem um menu diferente
      } else if (ua.includes('Safari')) {
        console.log('Detectado Safari: instruções para compartilhar');
        // Safari usa o botão compartilhar
      }
      
      return;
    }

    try {
      // Mostrar prompt de instalação
      console.log('Chamando prompt() no evento beforeinstallprompt');
      deferredPrompt.prompt();
      
      // Aguardar resposta do usuário
      const choiceResult = await deferredPrompt.userChoice;
      console.log('Resposta do userChoice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
        // Limpar o deferredPrompt
        window.deferredPrompt = null;
        setDeferredPrompt(null);
        
        // Atualizar o estado para mostrar que o app foi instalado
        // O evento appinstalled também será acionado, mas fazemos isso como garantia
        setIsAppInstalled(true);
        
        toast({
          title: "Instalação iniciada",
          description: "O aplicativo está sendo instalado no seu dispositivo.",
          variant: "default",
        });
      } else {
        console.log('Usuário recusou a instalação');
        toast({
          title: "Instalação cancelada",
          description: "Você pode instalar o aplicativo mais tarde se desejar.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao tentar instalar o PWA:', error);
      toast({
        title: "Erro na instalação",
        description: "Ocorreu um erro ao tentar instalar o aplicativo. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const toggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribeFromNotifications();
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais notificações de agendamentos.",
        variant: "default",
      });
    } else {
      const result = await subscribeToNotifications();
      if (result) {
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações de agendamentos no seu dispositivo.",
          variant: "default",
        });
      }
    }
  };

  // Redirecionar para a página de login se o usuário não estiver autenticado
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Aplicativo Móvel</h1>
      <p className="text-gray-500 mb-8">
        Instale o aplicativo da Sala de Informática em seu dispositivo e receba notificações de agendamentos.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="app">
            <Download className="w-4 h-4 mr-2" />
            Instalação
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="app">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Instalar Aplicativo</CardTitle>
                <CardDescription>
                  Adicione o aplicativo à tela inicial do seu dispositivo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <Smartphone className="h-24 w-24 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Benefícios:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Acesso rápido sem abrir o navegador</li>
                    <li>Interface otimizada para dispositivos móveis</li>
                    <li>Notificações mesmo com o navegador fechado</li>
                    <li>Funciona offline com dados em cache</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleInstallClick} 
                  className="w-full" 
                  disabled={isAppInstalled}
                >
                  {isAppInstalled 
                    ? "Aplicativo Instalado" 
                    : "Instalar Aplicativo"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instruções de Instalação</CardTitle>
                <CardDescription>
                  Siga os passos para instalar o aplicativo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                      1
                    </div>
                    <p>Clique no botão "Instalar Aplicativo"</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                      2
                    </div>
                    <p>Confirme a instalação no prompt exibido</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                      3
                    </div>
                    <p>O aplicativo será adicionado à sua tela inicial</p>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                  <div className="flex space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800">Instalação Manual</h4>
                      <p className="text-sm text-amber-700">
                        Em alguns navegadores, você pode precisar usar o menu do navegador e 
                        selecionar "Adicionar à tela inicial" ou "Instalar aplicativo".
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ativar Notificações</CardTitle>
                <CardDescription>
                  Receba alertas sobre agendamentos, alterações e lembretes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <Bell className="h-24 w-24 text-primary" />
                </div>

                <div className="py-2 px-4 rounded-md flex items-center space-x-2 bg-slate-50 border">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ 
                      backgroundColor: 
                        permissionState === 'granted' ? '#10b981' : 
                        permissionState === 'denied' ? '#ef4444' : '#f59e0b'
                    }}
                  />
                  <div>
                    <span className="text-sm font-medium">Status: </span>
                    <span className="text-sm">
                      {permissionState === 'granted' ? 'Permitido' : 
                       permissionState === 'denied' ? 'Bloqueado' : 'Não configurado'}
                    </span>
                  </div>
                </div>

                {permissionState === 'denied' && (
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <div className="flex space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-800">Permissão Bloqueada</h4>
                        <p className="text-sm text-red-700">
                          As notificações estão bloqueadas nas configurações do seu navegador. 
                          Você precisará permitir notificações nas configurações do site.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isSubscribed && (
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <div className="flex space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-800">Notificações Ativas</h4>
                        <p className="text-sm text-green-700">
                          Você receberá notificações sobre seus agendamentos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={toggleNotifications} 
                  className="w-full"
                  disabled={isSubscribing || permissionState === 'denied'}
                  variant={isSubscribed ? "outline" : "default"}
                >
                  {isSubscribing 
                    ? "Processando..." 
                    : isSubscribed 
                    ? "Desativar Notificações" 
                    : "Ativar Notificações"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sobre as Notificações</CardTitle>
                <CardDescription>
                  O que você receberá e como configurar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium">Tipos de Notificações:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">Lembretes de Agendamento</span>
                        <p className="text-sm text-gray-500">Notificações antes do início do seu agendamento.</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">Alterações</span>
                        <p className="text-sm text-gray-500">Avisos quando houver mudanças em agendamentos.</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">Informativos</span>
                        <p className="text-sm text-gray-500">Comunicados importantes sobre a sala de informática.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-1">Dica</h4>
                  <p className="text-sm text-blue-700">
                    Para uma melhor experiência, instale o aplicativo na sua tela inicial 
                    para garantir que as notificações funcionem mesmo com o navegador fechado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}