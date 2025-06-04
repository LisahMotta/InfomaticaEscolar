import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rocket, RefreshCw } from "lucide-react";

const notificationSchema = z.object({
  title: z.string().min(3, {
    message: "O título deve ter pelo menos 3 caracteres",
  }),
  message: z.string().min(5, {
    message: "A mensagem deve ter pelo menos 5 caracteres",
  }),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function SendNotificationForm() {
  const { toast } = useToast();
  const [sentCount, setSentCount] = useState(0);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await apiRequest("POST", "/api/push/send-all", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.warning) {
        toast({
          title: data.message,
          description: data.info,
          variant: "destructive",  // Usando destructive em vez de warning, pois é um dos tipos suportados
        });
      } else {
        toast({
          title: "Notificações enviadas com sucesso",
          description: `A mensagem foi enviada para todos os usuários inscritos.`,
        });
        setSentCount((prev) => prev + 1);
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar notificações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: NotificationFormValues) {
    sendMutation.mutate(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Enviar notificação para todos os usuários
        </CardTitle>
        <CardDescription>
          Envie uma notificação para todos os usuários que ativaram as notificações push.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aviso importante" {...field} />
                  </FormControl>
                  <FormDescription>
                    Um título curto e claro para a notificação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Lembramos que amanhã o laboratório estará fechado para manutenção."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    O conteúdo principal da notificação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            {sentCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {sentCount} notificação(ões) enviada(s) nesta sessão
              </p>
            )}
            <Button
              type="submit"
              disabled={sendMutation.isPending}
              className="ml-auto"
            >
              {sendMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar notificação
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}