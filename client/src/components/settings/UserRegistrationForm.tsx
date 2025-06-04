import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CLASS_OPTIONS, UserRole, GRADES } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Definindo o schema para cadastro de usuário
const createUserSchema = z.object({
  username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
  password: z.string().min(6, { message: "A senha precisa ter pelo menos 6 caracteres" }),
  passwordConfirm: z.string().min(6, { message: "A senha precisa ter pelo menos 6 caracteres" }),
  displayName: z.string().min(3, { message: "Nome completo é obrigatório" }),
  role: z.nativeEnum(UserRole),
  assignedClass: z.string().optional().nullable(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "As senhas não coincidem",
  path: ["passwordConfirm"],
});

type FormValues = z.infer<typeof createUserSchema>;

export default function UserRegistrationForm() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
      displayName: "",
      role: UserRole.TEACHER,
      assignedClass: Object.keys(CLASS_OPTIONS)[0],
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      // Remover campo de confirmação de senha antes de enviar para a API
      const { passwordConfirm, ...userData } = data;
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário cadastrado",
        description: "O novo usuário foi cadastrado com sucesso.",
        variant: "default",
      });
      form.reset();
      // Recarregar dados de usuários se necessário
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar usuário",
        description: error.message || "Ocorreu um erro ao cadastrar o usuário.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    registerMutation.mutate(data);
  }

  // Obtém as opções de turma com base no papel selecionado
  const getClassOptions = () => {
    // Somente exibir seleção de turma para professores
    if (form.watch("role") === UserRole.TEACHER) {
      return Object.entries(CLASS_OPTIONS).map(([value, label]) => (
        <SelectItem key={value} value={value}>
          {label}
        </SelectItem>
      ));
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar Novo Usuário</CardTitle>
        <CardDescription>
          Adicione novos professores ou coordenadores ao sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome de usuário" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome de usuário para login no sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome que será exibido no sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Digite a senha" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo de 6 caracteres.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirme a senha"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.TEACHER}>Professor</SelectItem>
                      <SelectItem value={UserRole.COORDINATOR}>Coordenador</SelectItem>
                      <SelectItem value={UserRole.PROATI}>PROATI</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define as permissões do usuário no sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("role") === UserRole.TEACHER && (
              <FormField
                control={form.control}
                name="assignedClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getClassOptions()}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Turma que o professor vai gerenciar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Usuário"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}