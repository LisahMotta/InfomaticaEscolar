import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Bell, BellOff } from "lucide-react";

export default function NotificationToggle() {
  const [permissionState, setPermissionState] = useState<NotificationPermission | "default">("default");
  const { toast } = useToast();
  const { 
    isPushSupported, 
    permissionStatus,
    isSubscribed, 
    subscribeToNotifications,
    unsubscribeFromNotifications,
    subscriptionLoading,
  } = usePushNotifications();

  useEffect(() => {
    if (permissionStatus) {
      setPermissionState(permissionStatus);
    }
  }, [permissionStatus]);

  const handleToggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeFromNotifications();
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações push.",
        });
      } else {
        await subscribeToNotifications();
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações sobre os agendamentos.",
        });
      }
    } catch (error) {
      console.error("Erro ao gerenciar subscrição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerenciar as notificações. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  if (!isPushSupported) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <BellOff className="h-4 w-4" />
        Notificações não suportadas
      </Button>
    );
  }

  if (permissionState === "denied") {
    return (
      <Button
        variant="outline"
        disabled
        className="gap-2"
        title="Permissão de notificações bloqueada. Verifique as configurações do seu navegador."
      >
        <BellOff className="h-4 w-4" />
        Notificações bloqueadas
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      onClick={handleToggleSubscription}
      disabled={subscriptionLoading}
      className="gap-2"
    >
      {isSubscribed ? (
        <>
          <Bell className="h-4 w-4" />
          Notificações ativadas
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          Ativar notificações
        </>
      )}
    </Button>
  );
}