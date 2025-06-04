import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define grades with their respective classes
export const GRADES = {
  // Anos Iniciais (Ensino Fundamental I)
  FIRST: { id: 1, name: "1° Ano", classes: ["A", "B", "C"], period: "afternoon" },
  SECOND: { id: 2, name: "2° Ano", classes: ["A", "B", "C"], period: "afternoon" },
  THIRD: { id: 3, name: "3° Ano", classes: ["A", "B"], period: "afternoon" },
  FOURTH: { id: 4, name: "4° Ano", classes: ["A", "B"], period: "afternoon" },
  FIFTH: { id: 5, name: "5° Ano", classes: ["A", "B"], period: "afternoon" },
  
  // Anos Finais (Ensino Fundamental II - período matutino)
  SIXTH: { id: 6, name: "6° Ano", classes: ["A", "B"], period: "morning" },
  SEVENTH: { id: 7, name: "7° Ano", classes: ["A", "B"], period: "morning" },
  EIGHTH: { id: 8, name: "8° Ano", classes: ["A", "B", "C"], period: "morning" },
  NINTH: { id: 9, name: "9° Ano", classes: ["A", "B", "C"], period: "morning" },
  FIRST_HS_MORNING: { id: 10, name: "1° EM", classes: ["A", "B"], period: "morning" },
  
  // Ensino Médio (período noturno)
  FIRST_HS_NIGHT: { id: 11, name: "1° EM", classes: ["C", "D"], period: "night" },
  SECOND_HS: { id: 12, name: "2° EM", classes: ["A", "B"], period: "night" },
  THIRD_HS: { id: 13, name: "3° EM", classes: ["A", "B"], period: "night" },
};

// Define time slots for afternoon classes (Anos Iniciais - 13h às 18h20)
export const AFTERNOON_TIME_SLOTS = [
  { id: 1, start: "13:00", end: "13:50", period: "afternoon" },
  { id: 2, start: "13:50", end: "14:40", period: "afternoon" },
  // Intervalo do 4° e 5° anos (14:40 às 15:00)
  { id: 3, start: "15:00", end: "15:50", period: "afternoon" },
  // Intervalo do 1°, 2° e 3° anos (15:30 às 15:50)
  { id: 4, start: "15:50", end: "16:40", period: "afternoon" },
  { id: 5, start: "16:40", end: "17:30", period: "afternoon" },
  { id: 6, start: "17:30", end: "18:20", period: "afternoon" },
];

// Define time slots for morning classes (Anos Finais - 7h às 12h20)
export const MORNING_TIME_SLOTS = [
  { id: 7, start: "07:00", end: "07:50", period: "morning" },
  { id: 8, start: "07:50", end: "08:40", period: "morning" },
  { id: 9, start: "08:40", end: "09:30", period: "morning" },
  // Intervalo (09:30 às 09:50)
  { id: 10, start: "09:50", end: "10:40", period: "morning" },
  { id: 11, start: "10:40", end: "11:30", period: "morning" },
  { id: 12, start: "11:30", end: "12:20", period: "morning" },
];

// Define time slots for night classes (Ensino Médio - 18h50 às 22h50)
export const NIGHT_TIME_SLOTS = [
  { id: 13, start: "18:50", end: "19:35", period: "night" },
  { id: 14, start: "19:35", end: "20:20", period: "night" },
  // Intervalo (20:20 às 20:35)
  { id: 15, start: "20:35", end: "21:20", period: "night" },
  { id: 16, start: "21:20", end: "22:05", period: "night" },
  { id: 17, start: "22:05", end: "22:50", period: "night" },
];

// Combine all time slots for lookup purposes
export const TIME_SLOTS = [...AFTERNOON_TIME_SLOTS, ...MORNING_TIME_SLOTS, ...NIGHT_TIME_SLOTS];

// Define os horários de intervalo por séries e períodos
export const BREAK_TIMES = {
  // Anos Iniciais (tarde)
  AFTERNOON_UPPER_GRADES: { start: "14:40", end: "15:00", grades: [4, 5], period: "afternoon" },
  AFTERNOON_LOWER_GRADES: { start: "15:30", end: "15:50", grades: [1, 2, 3], period: "afternoon" },
  
  // Anos Finais (manhã)
  MORNING_GRADES: { start: "09:30", end: "09:50", grades: [6, 7, 8, 9, 10], period: "morning" },
  
  // Ensino Médio (noite)
  NIGHT_GRADES: { start: "20:20", end: "20:35", grades: [11, 12, 13], period: "night" },
};

// Define equipment options
export const EQUIPMENT_TYPES = [
  { id: 1, name: "Chromebooks" },
  { id: 2, name: "Laboratório" },
  { id: 3, name: "Tablets" },
  { id: 4, name: "Projetor" },
  { id: 5, name: "Notebook Positivo" },
];

// Database table for users (teachers)
// Definir enum para o tipo de usuário
export enum UserRole {
  PROATI = 'proati',      // Pode fazer tudo
  TEACHER = 'teacher',    // Pode agendar apenas para sua turma
  COORDINATOR = 'coordinator' // Pode apenas visualizar
}

// Definir turmas disponíveis
export const CLASS_OPTIONS = [
  // Anos Iniciais
  '1A', '1B', '1C', 
  '2A', '2B', '2C', 
  '3A', '3B', 
  '4A', '4B', 
  '5A', '5B',
  
  // Anos Finais
  '6A', '6B',
  '7A', '7B',
  '8A', '8B', '8C',
  '9A', '9B', '9C',
  '1EM-A', '1EM-B'
];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default('teacher'),
  assignedClass: text("assigned_class"),
});

// Database table for schedules
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  gradeId: integer("grade_id").notNull(),
  gradeClass: text("grade_class").notNull(),
  teacherName: text("teacher_name").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  timeSlotId: integer("time_slot_id").notNull(),
  content: text("content").notNull(),
  equipmentId: integer("equipment_id").notNull(),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  // Campo para definir o período (manhã ou tarde)
  period: text("period").notNull().default("afternoon"), // morning ou afternoon
  // Campos para recorrência
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency").default("none"), // none, weekly
  recurringEndDate: text("recurring_end_date"), // Formato: YYYY-MM-DD (opcional)
  recurringParentId: integer("recurring_parent_id"), // ID do agendamento original
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  role: true,
  assignedClass: true,
});

// Validação específica para o formulário de registro
export const registerUserSchema = insertUserSchema.extend({
  username: z.string().min(3, "Nome de usuário deve ter ao menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  displayName: z.string().min(3, "Nome completo é obrigatório"),
  role: z.enum([UserRole.PROATI, UserRole.TEACHER, UserRole.COORDINATOR]),
  assignedClass: z.string().nullable().optional(),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória")
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
}).refine(
  data => !(data.role === UserRole.TEACHER && !data.assignedClass), {
    message: "Professores devem selecionar uma turma",
    path: ["assignedClass"]
  }
);

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  gradeId: true,
  gradeClass: true,
  teacherName: true,
  date: true,
  timeSlotId: true,
  content: true,
  equipmentId: true,
  notes: true,
  period: true,
  isRecurring: true,
  recurringFrequency: true,
  recurringEndDate: true,
  recurringParentId: true,
});

// Create validation schema for schedule input
export const scheduleFormSchema = insertScheduleSchema.extend({
  gradeId: z.number().min(1).max(10), // Atualizado para incluir séries até o 1º EM (id 10)
  gradeClass: z.string().min(1).max(5), // Atualizado para permitir classes como "1EM-A"
  teacherName: z.string().min(3, "O nome do professor é obrigatório"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido"),
  timeSlotId: z.number().min(1).max(12), // Atualizado para incluir todos os horários
  content: z.string().min(3, "O conteúdo é obrigatório"),
  equipmentId: z.number().min(1).max(5),
  period: z.enum(["morning", "afternoon"]).default("afternoon"),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringFrequency: z.enum(["none", "weekly"]).optional().default("none"),
  recurringEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido").optional(),
  recurringParentId: z.number().optional(),
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).pick({
  userId: true,
  endpoint: true,
  p256dh: true,
  auth: true,
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Helper function to get grade name from ID
export function getGradeName(gradeId: number): string {
  return Object.values(GRADES).find(grade => grade.id === gradeId)?.name || '';
}

// Helper function to get grade color class from ID
export function getGradeColorClass(gradeId: number): string {
  const grade = Object.values(GRADES).find(g => g.id === gradeId);
  
  // Cores por período
  if (grade?.period === "morning") { // Turmas da manhã (anos finais)
    switch (gradeId) {
      case 6: return "blue-600"; // 6° Ano
      case 7: return "cyan-600"; // 7° Ano
      case 8: return "teal-600"; // 8° Ano
      case 9: return "sky-600"; // 9° Ano
      case 10: return "indigo-600"; // 1° EM (Manhã)
      default: return "blue-500";
    }
  } else if (grade?.period === "afternoon") { // Turmas da tarde (anos iniciais)
    switch (gradeId) {
      case 1: return "grade1"; // 1° Ano
      case 2: return "grade2"; // 2° Ano
      case 3: return "grade3"; // 3° Ano
      case 4: return "grade4"; // 4° Ano
      case 5: return "grade5"; // 5° Ano
      default: return "orange-500";
    }
  } else if (grade?.period === "night") { // Turmas da noite (ensino médio)
    switch (gradeId) {
      case 11: return "purple-600"; // 1° EM (Noite)
      case 12: return "fuchsia-600"; // 2° EM
      case 13: return "pink-600"; // 3° EM
      default: return "purple-500";
    }
  }
  
  return "primary"; // Cor padrão
}

// Helper function to get time slot string from ID
export function getTimeSlot(timeSlotId: number): { start: string, end: string } | undefined {
  return TIME_SLOTS.find(slot => slot.id === timeSlotId);
}

// Helper function to get equipment name from ID
export function getEquipmentName(equipmentId: number): string {
  return EQUIPMENT_TYPES.find(equipment => equipment.id === equipmentId)?.name || '';
}
