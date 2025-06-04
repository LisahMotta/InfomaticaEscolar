import { 
  users, 
  schedules, 
  pushSubscriptions,
  type User, 
  type InsertUser, 
  type Schedule, 
  type InsertSchedule,
  type PushSubscription,
  type InsertPushSubscription
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Schedule operations
  getAllSchedules(): Promise<Schedule[]>;
  getScheduleById(id: number): Promise<Schedule | undefined>;
  getSchedulesByDate(date: string): Promise<Schedule[]>;
  getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]>;
  getSchedulesByGrade(gradeId: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  getUpcomingSchedules(limit: number): Promise<Schedule[]>;
  
  // Push notification operations
  savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getUserPushSubscriptions(userId: number): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Verificar e garantir que as colunas necessárias existam
      await this.ensureColumnsExist();
      
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error("Error in getUser:", error);
      // Tentar buscar apenas os campos básicos
      const [basicUser] = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password
        })
        .from(users)
        .where(eq(users.id, id));
      
      if (basicUser) {
        return {
          ...basicUser,
          displayName: basicUser.username,
          role: 'proati',
          assignedClass: null
        };
      }
      
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Verificar e garantir que as colunas necessárias existam
      await this.ensureColumnsExist();
      
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      // Tentar buscar apenas os campos básicos
      const [basicUser] = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password
        })
        .from(users)
        .where(eq(users.username, username));
      
      if (basicUser) {
        return {
          ...basicUser,
          displayName: basicUser.username,
          role: 'proati',
          assignedClass: null
        };
      }
      
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Verificar e garantir que as colunas necessárias existam
      await this.ensureColumnsExist();
      
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      // Verificar e garantir que as colunas necessárias existam
      await this.ensureColumnsExist();
      
      const result = await db.select().from(users);
      return result;
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return [];
    }
  }
  
  // Método auxiliar para garantir que as colunas necessárias existam
  private async ensureColumnsExist(): Promise<void> {
    try {
      // Verificar se a coluna displayName existe
      await db.select({ displayName: users.displayName }).from(users).limit(1);
      
      // Tentar selecionar a coluna isCompleted para verificar se existe
      try {
        await db.select({ isCompleted: schedules.isCompleted }).from(schedules).limit(1);
      } catch (error) {
        console.log("Adding is_completed column to schedules table...");
        await db.execute(`
          ALTER TABLE schedules 
          ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
        `);
      }
      
    } catch (error) {
      console.log("Auto-migrating database schema...");
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Usuário',
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher',
        ADD COLUMN IF NOT EXISTS assigned_class TEXT;
      `);
      
      // Adicionar coluna is_completed à tabela de agendamentos
      await db.execute(`
        ALTER TABLE schedules
        ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
      `);
    }
  }

  // Schedule operations
  async getAllSchedules(): Promise<Schedule[]> {
    return db.select().from(schedules);
  }

  async getScheduleById(id: number): Promise<Schedule | undefined> {
    const result = await db.select().from(schedules).where(eq(schedules.id, id));
    return result[0];
  }

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    return db.select().from(schedules).where(eq(schedules.date, date));
  }

  async getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    return db.select()
      .from(schedules)
      .where(
        and(
          gte(schedules.date, startDate),
          lte(schedules.date, endDate)
        )
      );
  }

  async getSchedulesByGrade(gradeId: number): Promise<Schedule[]> {
    return db.select().from(schedules).where(eq(schedules.gradeId, gradeId));
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const result = await db
      .insert(schedules)
      .values({ ...insertSchedule, isCompleted: false })
      .returning();
    return result[0];
  }

  async updateSchedule(id: number, scheduleUpdate: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const result = await db
      .update(schedules)
      .set(scheduleUpdate)
      .where(eq(schedules.id, id))
      .returning();
    return result[0];
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await db
      .delete(schedules)
      .where(eq(schedules.id, id))
      .returning({ id: schedules.id });
    return result.length > 0;
  }

  async getUpcomingSchedules(limit: number): Promise<Schedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const result = await db
      .select()
      .from(schedules)
      .where(gte(schedules.date, todayStr))
      .orderBy(schedules.date, schedules.timeSlotId)
      .limit(limit);
    
    return result;
  }
  
  // Push Notification operations
  async savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    try {
      // Verificar se a subscrição já existe
      const existing = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      
      if (existing.length > 0) {
        // Se já existe, atualiza
        const [result] = await db.update(pushSubscriptions)
          .set({
            p256dh: subscription.p256dh,
            auth: subscription.auth
          })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
          .returning();
        return result;
      }
      
      // Se não existe, cria nova
      const [result] = await db.insert(pushSubscriptions)
        .values(subscription)
        .returning();
      return result;
    } catch (error) {
      console.error("Error saving push subscription:", error);
      throw error;
    }
  }
  
  async getUserPushSubscriptions(userId: number): Promise<PushSubscription[]> {
    try {
      const subscriptions = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
      return subscriptions;
    } catch (error) {
      console.error("Error getting user push subscriptions:", error);
      return [];
    }
  }
  
  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    try {
      const subscriptions = await db.select().from(pushSubscriptions);
      return subscriptions;
    } catch (error) {
      console.error("Error getting all push subscriptions:", error);
      return [];
    }
  }
  
  async deletePushSubscription(endpoint: string): Promise<boolean> {
    try {
      const result = await db.delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint))
        .returning({ id: pushSubscriptions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting push subscription:", error);
      return false;
    }
  }

  // Method to seed initial data if needed
  async seedInitialData(): Promise<void> {
    try {
      // Check if we have the display_name column in users table
      try {
        // Tente fazer uma seleção que inclui displayName para verificar se a coluna existe
        await db.select({ displayName: users.displayName }).from(users).limit(1);
      } catch (error) {
        // Se falhar, é provável que a coluna não exista, então vamos executar uma migração
        console.log("Applying database migration for user schema changes");
        await db.execute(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Usuário',
          ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher',
          ADD COLUMN IF NOT EXISTS assigned_class TEXT;
        `);
      }

      // Verificar e adicionar a coluna isCompleted à tabela schedules
      try {
        await db.select({ isCompleted: schedules.isCompleted }).from(schedules).limit(1);
      } catch (error) {
        console.log("Adding missing columns to schedules table...");
        await db.execute(`
          ALTER TABLE schedules 
          ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS recurring_frequency TEXT DEFAULT 'none',
          ADD COLUMN IF NOT EXISTS recurring_end_date TEXT,
          ADD COLUMN IF NOT EXISTS recurring_parent_id INTEGER;
        `);
      }

      // Criar a tabela de push_subscriptions, se não existir
      await db.execute(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Check if we already have users
      const userCount = await db.select({ count: { value: users.id } }).from(users);
      
      // If no users, create default admin
      if (!userCount[0] || !userCount[0].count.value) {
        console.log("Creating default admin user 'proati' with password 'proati123'");
        
        // Calcular o hash da senha usando scrypt
        const { hashPassword } = await import('./auth');
        const hashedPassword = await hashPassword('proati123');
        
        const [user] = await db.insert(users).values({
          username: 'proati',
          password: hashedPassword,
          displayName: 'PROATI Admin',
          role: 'proati',
          assignedClass: null
        }).returning();
        
        console.log("Default admin user created successfully!");
      }
      
      // Verificar se existe um usuário coordenador
      const coordinator = await db.select().from(users).where(eq(users.username, 'coord')).limit(1);
      
      if (!coordinator.length) {
        console.log("Creating default coordinator user 'coord' with password 'coord123'");
        
        // Calcular o hash da senha usando scrypt
        const { hashPassword } = await import('./auth');
        const hashedPassword = await hashPassword('coord123');
        
        const [user] = await db.insert(users).values({
          username: 'coord',
          password: hashedPassword,
          displayName: 'Coordenador Pedagógico',
          role: 'coordinator',
          assignedClass: null
        }).returning();
        
        console.log("Default coordinator user created successfully!");
      }
    } catch (error) {
      console.error("Error in seedInitialData:", error);
    }
    
    // Check if we already have schedules
    const scheduleCount = await db.select({ count: { value: schedules.id } }).from(schedules);
    
    // If no schedules, create some examples
    if (!scheduleCount[0] || !scheduleCount[0].count.value) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      const todayStr = formatDate(today);
      const tomorrowStr = formatDate(tomorrow);
      const dayAfterTomorrowStr = formatDate(dayAfterTomorrow);
      
      // Some initial schedules for the current day
      const initialSchedules: InsertSchedule[] = [
        {
          gradeId: 1, 
          gradeClass: 'A', 
          teacherName: 'Márcia Santos', 
          date: todayStr, 
          timeSlotId: 1, 
          content: 'Alfabetização Digital', 
          equipmentId: 1, 
          notes: ''
        },
        {
          gradeId: 5, 
          gradeClass: 'B', 
          teacherName: 'Carlos Mendes', 
          date: todayStr, 
          timeSlotId: 2, 
          content: 'Pesquisa e Apresentação', 
          equipmentId: 2, 
          notes: ''
        },
        {
          gradeId: 3, 
          gradeClass: 'A', 
          teacherName: 'Ana Oliveira', 
          date: todayStr, 
          timeSlotId: 4, 
          content: 'Jogos Educativos', 
          equipmentId: 3, 
          notes: ''
        },
        {
          gradeId: 2, 
          gradeClass: 'B', 
          teacherName: 'Juliana Costa', 
          date: todayStr, 
          timeSlotId: 5, 
          content: 'Introdução à Digitação', 
          equipmentId: 1, 
          notes: ''
        },
        {
          gradeId: 4, 
          gradeClass: 'A', 
          teacherName: 'Ricardo Almeida', 
          date: todayStr, 
          timeSlotId: 6, 
          content: 'Criação de Apresentações', 
          equipmentId: 2, 
          notes: ''
        },
        // Schedules for the next day
        {
          gradeId: 1, 
          gradeClass: 'A', 
          teacherName: 'Márcia Santos', 
          date: tomorrowStr, 
          timeSlotId: 1, 
          content: 'Alfabetização Digital', 
          equipmentId: 1, 
          notes: ''
        },
        {
          gradeId: 5, 
          gradeClass: 'A', 
          teacherName: 'Renata Lima', 
          date: tomorrowStr, 
          timeSlotId: 4, 
          content: 'Pesquisa na Internet', 
          equipmentId: 2, 
          notes: ''
        },
        // Schedule for 2 days from now
        {
          gradeId: 2, 
          gradeClass: 'C', 
          teacherName: 'Roberto Dias', 
          date: dayAfterTomorrowStr, 
          timeSlotId: 6, 
          content: 'Jogos Educativos', 
          equipmentId: 3, 
          notes: ''
        }
      ];
      
      for (const schedule of initialSchedules) {
        await this.createSchedule(schedule);
      }
    }
  }
}

export const storage = new DatabaseStorage();
