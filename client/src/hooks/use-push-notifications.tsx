import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type PushSubscriptionData = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const { data: vapidPublicKey } = useQuery({
    queryKey: ["/api/push/vapid-public-key"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/push/vapid-public-key");
        const data = await res.json();
        return data.key;
      } catch (error) {
        console.error("Erro ao obter chave VAPID pública:", error);
        return null;
      }
    },
    enabled: !!user && !!swRegistration,
  });

  // Subscrever para notificações
  const subscribeMutation = useMutation({
    mutationFn: async (subscription: PushSubscriptionData) => {
      const res = await apiRequest("POST", "/api/push/subscribe", subscription);
      return res.json();
    },
    onSuccess: () => {
      setIsSubscribed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao ativar notificações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancelar subscrição de notificações
  const unsubscribeMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      const res = await apiRequest("DELETE", "/api/push/unsubscribe", { endpoint });
      return res.json();
    },
    onSuccess: () => {
      setIsSubscribed(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao desativar notificações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verificar suporte a notificações push e permissões
  useEffect(() => {
    const checkPushSupport = async () => {
      try {
        if (!("serviceWorker" in navigator)) {
          setIsPushSupported(false);
          return;
        }

        if (!("PushManager" in window)) {
          setIsPushSupported(false);
          return;
        }

        // Registrar service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        setSwRegistration(registration);
        setIsPushSupported(true);

        // Verificar permissão de notificações
        const permission = Notification.permission;
        setPermissionStatus(permission as NotificationPermission);
        
        // Verificar subscrição
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error("Erro ao verificar suporte a notificações push:", error);
        setIsPushSupported(false);
      }
    };

    checkPushSupport();
  }, []);

  // Converter array de bytes em string base64
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // Subscrever para notificações push
  async function subscribeToNotifications() {
    try {
      if (!swRegistration || !vapidPublicKey) {
        toast({
          title: "Erro ao configurar notificações",
          description: "Service Worker não registrado ou chave VAPID não disponível. Contate o administrador.",
          variant: "destructive",
        });
        throw new Error("Service Worker não registrado ou chave VAPID não disponível");
      }

      setSubscriptionLoading(true);

      // Verificar se o navegador suporta notificações
      if (!("Notification" in window)) {
        toast({
          title: "Notificações não suportadas",
          description: "Seu navegador não suporta notificações push. Tente usar um navegador mais recente como Chrome ou Firefox.",
          variant: "destructive",
        });
        throw new Error("Notificações não suportadas neste navegador");
      }

      // Solicitar permissão se necessário
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission !== "granted") {
          toast({
            title: "Permissão negada",
            description: "Você precisa permitir notificações para receber alertas de agendamentos.",
            variant: "destructive",
          });
          throw new Error("Permissão de notificações não concedida");
        }
      }

      // Convertendo a chave pública VAPID para o formato adequado
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      try {
        // Obter subscrição
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // Enviar dados da subscrição para o servidor
        const subscriptionJson = subscription.toJSON() as PushSubscriptionData;
        
        await subscribeMutation.mutateAsync(subscriptionJson);
        
        toast({
          title: "Notificações ativadas",
          description: "Você receberá alertas sobre seus agendamentos",
          variant: "default",
        });
        
        return subscription;
      } catch (subscribeError: any) {
        console.error("Erro detalhado:", subscribeError);
        
        if (subscribeError.name === 'NotAllowedError') {
          toast({
            title: "Permissão bloqueada",
            description: "As notificações estão bloqueadas. Verifique as configurações do seu navegador.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao ativar notificações",
            description: subscribeError.message || "Ocorreu um erro ao configurar as notificações",
            variant: "destructive",
          });
        }
        throw subscribeError;
      }
    } catch (error) {
      console.error("Erro ao subscrever para notificações push:", error);
      throw error;
    } finally {
      setSubscriptionLoading(false);
    }
  }

  // Cancelar subscrição de notificações push
  async function unsubscribeFromNotifications() {
    try {
      if (!swRegistration) {
        throw new Error("Service Worker não registrado");
      }

      setSubscriptionLoading(true);

      // Obter subscrição atual
      const subscription = await swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        throw new Error("Nenhuma subscrição encontrada");
      }

      // Cancelar subscrição
      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed) {
        // Enviar cancelamento para o servidor
        await unsubscribeMutation.mutateAsync(subscription.endpoint);
      }
    } catch (error) {
      console.error("Erro ao cancelar subscrição de notificações push:", error);
      throw error;
    } finally {
      setSubscriptionLoading(false);
    }
  }

  return {
    isPushSupported,
    permissionStatus,
    isSubscribed,
    subscriptionLoading,
    permissionState: permissionStatus,  // Alias para compatibilidade de nome
    isSubscribing: subscriptionLoading, // Alias para compatibilidade de nome
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };
}