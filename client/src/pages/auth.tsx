import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema, UserRole, CLASS_OPTIONS } from "@shared/schema";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Laptop, UserCog, Users } from "lucide-react";

// Schema para o formulário de login
const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerUserSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Formulário de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      role: UserRole.TEACHER,
      assignedClass: null,
    },
  });
  
  // Se o usuário já estiver logado, redireciona para a página inicial
  if (user) {
    return <Redirect to="/" />;
  }

  // Funções de submissão
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo - Formulário */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-2">Sala de Informática</h1>
          <p className="text-gray-500 mb-8">Sistema de controle de agendamentos</p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Fazer Login</CardTitle>
                  <CardDescription>
                    Entre com seu nome de usuário e senha
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de usuário</FormLabel>
                            <FormControl>
                              <Input placeholder="usuario" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center text-sm text-gray-500">
                  <p>Não tem uma conta? Clique em "Cadastro" acima.</p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Conta</CardTitle>
                  <CardDescription>
                    Preencha os dados para se cadastrar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome Completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de usuário</FormLabel>
                            <FormControl>
                              <Input placeholder="usuario" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Campo de role oculto - definirá todos como teacher por padrão */}
                      <input type="hidden" {...registerForm.register("role")} value={UserRole.TEACHER} />
                      
                      <FormField
                        control={registerForm.control}
                        name="assignedClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Turma</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione sua turma" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CLASS_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    Turma {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Selecione a turma para a qual deseja gerenciar agendamentos
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lado direito - Hero */}
      <div className="hidden md:flex md:w-1/2 bg-primary">
        <div className="m-auto p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">Sala de Informática</h1>
          <h2 className="text-2xl mb-6">Sistema de Controle de Agendamentos</h2>
          <ul className="list-disc pl-5 space-y-2 mb-8">
            <li>Agende horários para uso de equipamentos</li>
            <li>Coordene atividades para as 12 turmas</li>
            <li>Evite conflitos de horários</li>
            <li>Acompanhe o uso dos recursos digitais</li>
          </ul>
          <p className="text-white/70 text-sm mt-4">
            Sistema de gestão para organização eficiente dos recursos digitais.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <span className="text-sm">
                Para acessar o sistema, entre em contato com a administração.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}