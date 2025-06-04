import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CLASS_OPTIONS, User, UserRole } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Interface estendida para incluir tipos específicos
interface UserWithRole extends User {
  role: UserRole;
}

const getRoleLabel = (role: string): string => {
  switch (role) {
    case UserRole.PROATI:
      return "PROATI";
    case UserRole.TEACHER:
      return "Professor";
    case UserRole.COORDINATOR:
      return "Coordenador";
    default:
      return role;
  }
};

const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  switch (role) {
    case UserRole.PROATI:
      return "default";
    case UserRole.TEACHER:
      return "secondary";
    case UserRole.COORDINATOR:
      return "outline";
    default:
      return "outline";
  }
};

export default function UsersList() {
  // Busca a lista de usuários da API
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Erro ao carregar usuários: {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários do Sistema</CardTitle>
        <CardDescription>
          Lista de todos os usuários cadastrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users && users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Turma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === UserRole.TEACHER && user.assignedClass && 
                      (CLASS_OPTIONS[user.assignedClass as keyof typeof CLASS_OPTIONS] || user.assignedClass)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-4 text-gray-500">
            Nenhum usuário encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}