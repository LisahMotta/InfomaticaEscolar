import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { scheduleFormSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, format as dateFormat, endOfMonth } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

import { GRADES, EQUIPMENT_TYPES, TIME_SLOTS, MORNING_TIME_SLOTS, AFTERNOON_TIME_SLOTS, NIGHT_TIME_SLOTS, Schedule } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ScheduleFormProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTimeSlot?: number;
  editSchedule?: Schedule;
  period: 'morning' | 'afternoon' | 'night';
}

// Create a modified form schema that accepts string values for select fields but transforms them to numbers
const formSchema = z.object({
  gradeId: z.string().transform(val => parseInt(val)),
  gradeClass: z.string(),
  teacherName: z.string().min(3, "O nome do professor é obrigatório"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido"),
  timeSlotId: z.string().transform(val => parseInt(val)),
  content: z.string().min(3, "O conteúdo é obrigatório"),
  equipmentId: z.string().transform(val => parseInt(val)),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["none", "weekly"]).default("none"),
  recurringEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido").optional(),
  recurringParentId: z.number().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ScheduleForm({ 
  open, 
  onClose, 
  selectedDate, 
  selectedTimeSlot,
  editSchedule,
  period
}: ScheduleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize form with proper types
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gradeId: editSchedule ? editSchedule.gradeId.toString() : "",
      gradeClass: editSchedule ? editSchedule.gradeClass : "",
      teacherName: editSchedule ? editSchedule.teacherName : "",
      date: editSchedule ? editSchedule.date : format(selectedDate, "yyyy-MM-dd"),
      timeSlotId: selectedTimeSlot ? selectedTimeSlot.toString() : 
                 editSchedule ? editSchedule.timeSlotId.toString() : "",
      content: editSchedule ? editSchedule.content : "",
      equipmentId: editSchedule ? editSchedule.equipmentId.toString() : "",
      notes: editSchedule?.notes || "",
      // Campos de recorrência
      isRecurring: editSchedule?.isRecurring || false,
      recurringFrequency: (editSchedule?.recurringFrequency || "none") as "none" | "weekly",
      recurringEndDate: editSchedule?.recurringEndDate || dateFormat(endOfMonth(selectedDate), "yyyy-MM-dd"),
      recurringParentId: editSchedule?.recurringParentId || null,
    },
  });
  
  // Create and update mutations
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/schedules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/date/${form.getValues().date}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/upcoming'] });
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso!",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível criar o agendamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editSchedule) throw new Error("No schedule to update");
      const response = await apiRequest("PUT", `/api/schedules/${editSchedule.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/date/${form.getValues().date}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/upcoming'] });
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso!",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o agendamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: FormValues) => {
    if (editSchedule) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editSchedule ? "Editar Agendamento" : "Agendar Uso da Sala de Informática"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para agendar o uso dos equipamentos.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(GRADES)
                          .filter(grade => grade.period === period)
                          .map((grade) => (
                            <SelectItem key={grade.id} value={grade.id.toString()}>
                              {grade.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gradeClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("gradeId") && 
                          Object.values(GRADES).find(g => g.id.toString() === form.watch("gradeId"))?.classes.map(
                            (c) => (
                              <SelectItem key={c} value={c}>
                                Turma {c}
                              </SelectItem>
                            )
                          )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="teacherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professor(a)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do professor(a)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeSlotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(period === 'morning' ? MORNING_TIME_SLOTS : 
                          period === 'afternoon' ? AFTERNOON_TIME_SLOTS : 
                          NIGHT_TIME_SLOTS).map((slot) => (
                          <SelectItem key={slot.id} value={slot.id.toString()}>
                            {slot.start} - {slot.end}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Input placeholder="Assunto da aula" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id.toString()}>
                          {equipment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais (opcional)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seção de agendamento recorrente */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <h3 className="font-medium mb-2">Repetir Agendamento</h3>
              
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Repetir este agendamento</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("isRecurring") && (
                <div className="pl-7 space-y-4">
                  <FormField
                    control={form.control}
                    name="recurringFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recurringEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repetir até</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 
                  "Salvando..." : 
                  editSchedule ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
