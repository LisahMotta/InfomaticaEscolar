import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScheduleSchema, insertPushSubscriptionSchema, UserRole } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated, isProati } from "./auth";
import webpush from 'web-push';
import { pushConfig } from './config';

// Usando a declaração de tipos definida em shared/web-push.d.ts

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  
  // Health check endpoint já foi definido no index.ts
  
  // API routes for users
  app.get("/api/users", isAuthenticated, isProati, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remover senhas por segurança
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
  
  // API routes for schedules
  
  // Get all schedules
  app.get("/api/schedules", async (req: Request, res: Response) => {
    try {
      const schedules = await storage.getAllSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules", error });
    }
  });

  // Get schedules by date
  app.get("/api/schedules/date/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const schedules = await storage.getSchedulesByDate(date);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules by date", error });
    }
  });

  // Get schedules by date range
  app.get("/api/schedules/range", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const schedules = await storage.getSchedulesByDateRange(startDate, endDate);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules by date range", error });
    }
  });

  // Get schedules by grade
  app.get("/api/schedules/grade/:gradeId", async (req: Request, res: Response) => {
    try {
      const gradeId = parseInt(req.params.gradeId);
      if (isNaN(gradeId)) {
        return res.status(400).json({ message: "Invalid grade ID" });
      }
      
      const schedules = await storage.getSchedulesByGrade(gradeId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules by grade", error });
    }
  });

  // Get upcoming schedules
  app.get("/api/schedules/upcoming", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const schedules = await storage.getUpcomingSchedules(limit);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching upcoming schedules", error });
    }
  });

  // Get a single schedule by ID
  app.get("/api/schedules/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const schedule = await storage.getScheduleById(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedule", error });
    }
  });

  // Create a new schedule
  app.post("/api/schedules", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertScheduleSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Verificar se é um agendamento recorrente
      if (result.data.isRecurring && result.data.recurringFrequency === "weekly") {
        // Criar o agendamento principal
        const mainSchedule = await storage.createSchedule(result.data);
        
        // Se tiver data final de recorrência, criar agendamentos recorrentes até essa data
        if (result.data.recurringEndDate) {
          const startDate = new Date(result.data.date);
          const endDate = new Date(result.data.recurringEndDate);
          
          // Lista para armazenar todos os agendamentos criados
          const createdSchedules = [mainSchedule];
          
          // Criar agendamentos semanais
          let currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + 7); // Avança 1 semana
          
          while (currentDate <= endDate) {
            // Criar uma cópia do agendamento para a próxima semana
            const recurringData = {
              ...result.data,
              date: currentDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
              isRecurring: false, // Marcar como não recorrente, já que são cópias
              recurringParentId: mainSchedule.id // Referência ao agendamento original
            };
            
            // Criar o agendamento para esta semana
            const newRecurringSchedule = await storage.createSchedule(recurringData);
            createdSchedules.push(newRecurringSchedule);
            
            // Avançar mais uma semana
            currentDate.setDate(currentDate.getDate() + 7);
          }
          
          // Retornar o agendamento principal e a contagem total
          res.status(201).json({
            schedule: mainSchedule,
            totalCreated: createdSchedules.length,
            message: `Agendamento criado com sucesso e repetido por ${createdSchedules.length} semanas.`
          });
        } else {
          // Se não tiver data final, apenas retornar o agendamento principal
          res.status(201).json(mainSchedule);
        }
      } else {
        // Caso não seja recorrente, criar um único agendamento
        const newSchedule = await storage.createSchedule(result.data);
        res.status(201).json(newSchedule);
      }
    } catch (error) {
      res.status(500).json({ message: "Error creating schedule", error });
    }
  });

  // Update a schedule
  app.put("/api/schedules/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      // Partial validation for update
      const result = insertScheduleSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedSchedule = await storage.updateSchedule(id, result.data);
      if (!updatedSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      res.status(500).json({ message: "Error updating schedule", error });
    }
  });

  // Delete a schedule
  app.delete("/api/schedules/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const success = await storage.deleteSchedule(id);
      if (!success) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting schedule", error });
    }
  });
  
  // Marcar agendamento como concluído/não concluído
  app.patch("/api/schedules/:id/complete", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de agendamento inválido" });
      }
      
      const { isCompleted } = req.body;
      if (typeof isCompleted !== 'boolean') {
        return res.status(400).json({ message: "O parâmetro isCompleted deve ser um booleano" });
      }
      
      // Buscar agendamento atual
      const schedule = await storage.getScheduleById(id);
      if (!schedule) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      
      // Se o usuário for professor, verificar se tem permissão para esta turma
      if (req.user.role === UserRole.TEACHER) {
        const userGradeId = parseInt(req.user.assignedClass.charAt(0));
        const userClass = req.user.assignedClass.charAt(1);
        
        if (userGradeId !== schedule.gradeId || userClass !== schedule.gradeClass) {
          return res.status(403).json({ 
            message: "Você só pode marcar como concluído agendamentos da sua turma" 
          });
        }
      }
      
      // Atualizar o status de conclusão
      const updatedSchedule = await storage.updateSchedule(id, { isCompleted });
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: "Não foi possível atualizar o agendamento" });
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status do agendamento", error });
    }
  });

  // Configuração de chaves para Web Push
  if (pushConfig.vapidPublicKey && pushConfig.vapidPrivateKey) {
    webpush.setVapidDetails(
      pushConfig.contactEmail,
      pushConfig.vapidPublicKey,
      pushConfig.vapidPrivateKey
    );
    console.log("Web Push configurado com sucesso!");
  } else {
    console.warn("Web Push pode não funcionar sem as chaves VAPID configuradas");
  }

  // Rotas para Push Notifications

  // Rota para obter a chave pública VAPID
  app.get('/api/push/vapid-public-key', (req, res) => {
    if (pushConfig.vapidPublicKey) {
      res.json({ key: pushConfig.vapidPublicKey });
    } else {
      res.status(500).json({ message: "VAPID_PUBLIC_KEY não configurada" });
    }
  });

  // Rota para salvar uma nova subscrição push
  app.post('/api/push/subscribe', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const result = insertPushSubscriptionSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const subscription = await storage.savePushSubscription(result.data);
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Erro ao salvar subscrição push:", error);
      res.status(500).json({ message: "Erro ao salvar subscrição push" });
    }
  });

  // Rota para cancelar uma subscrição push
  app.delete('/api/push/unsubscribe', isAuthenticated, async (req, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint é obrigatório" });
      }
      
      const success = await storage.deletePushSubscription(endpoint);
      
      if (success) {
        res.json({ message: "Subscrição cancelada com sucesso" });
      } else {
        res.status(404).json({ message: "Subscrição não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao cancelar subscrição push:", error);
      res.status(500).json({ message: "Erro ao cancelar subscrição push" });
    }
  });

  // Rota para enviar uma notificação de teste
  app.post('/api/push/send-test', isAuthenticated, isProati, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "ID do usuário é obrigatório" });
      }
      
      const subscriptions = await storage.getUserPushSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        return res.status(404).json({ message: "Nenhuma subscrição encontrada para este usuário" });
      }
      
      const notificationPayload = {
        title: 'Notificação de Teste',
        body: 'Esta é uma notificação de teste do sistema de gerenciamento de laboratório',
        icon: '/assets/icons/icon-96x96.png',
        data: {
          url: '/'
        }
      };
      
      const promises = subscriptions.map(subscription => {
        return webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }, JSON.stringify(notificationPayload))
        .catch(error => {
          console.error("Erro ao enviar notificação:", error);
          if (error.statusCode === 410) {
            // Subscrição expirou ou foi cancelada
            return storage.deletePushSubscription(subscription.endpoint);
          }
        });
      });
      
      await Promise.all(promises);
      
      res.json({ message: "Notificação de teste enviada com sucesso" });
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      res.status(500).json({ message: "Erro ao enviar notificação de teste" });
    }
  });

  // Rota para enviar notificações para todos os usuários
  app.post('/api/push/send-all', isAuthenticated, isProati, async (req, res) => {
    try {
      const { message, title } = req.body;
      
      if (!message || !title) {
        return res.status(400).json({ message: "Título e mensagem são obrigatórios" });
      }
      
      const subscriptions = await storage.getAllPushSubscriptions();
      
      if (subscriptions.length === 0) {
        return res.status(200).json({ 
          message: "Nenhum usuário inscrito para notificações",
          warning: true,
          info: "Usuários precisam acessar a página 'Aplicativo Móvel' e ativar as notificações"
        });
      }
      
      const notificationPayload = {
        title,
        body: message,
        icon: '/assets/icons/icon-96x96.png',
        data: {
          url: '/'
        }
      };
      
      const promises = subscriptions.map(subscription => {
        return webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }, JSON.stringify(notificationPayload))
        .catch(error => {
          if (error.statusCode === 410) {
            // Subscrição expirou ou foi cancelada
            return storage.deletePushSubscription(subscription.endpoint);
          }
        });
      });
      
      await Promise.all(promises);
      
      res.json({ message: "Notificações enviadas com sucesso" });
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
      res.status(500).json({ message: "Erro ao enviar notificações" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
