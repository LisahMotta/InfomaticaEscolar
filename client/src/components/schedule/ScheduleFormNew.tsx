import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GRADES, EQUIPMENT_TYPES, TIME_SLOTS, MORNING_TIME_SLOTS, AFTERNOON_TIME_SLOTS, NIGHT_TIME_SLOTS, Schedule } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays, endOfMonth } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScheduleFormProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTimeSlot?: number;
  editSchedule?: Schedule;
  period: 'morning' | 'afternoon' | 'night';
}

// Definindo o schema para o formulário
const formSchema = z.object({
  gradeId: z.string(),
  gradeClass: z.string(),
  teacherName: z.string().min(3, "O nome do professor é obrigatório"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido"),
  timeSlotId: z.string(),
  content: z.string().min(3, "O conteúdo é obrigatório"),
  equipmentId: z.string(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string(),
  recurringEndDate: z.string().optional(),
});

// Tipo inferido do schema
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
  
  // Inicializar formulário
  const form = useForm<FormValues>({
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
      isRecurring: editSchedule?.isRecurring || false,
      recurringFrequency: editSchedule?.recurringFrequency || "none",
      recurringEndDate: editSchedule?.recurringEndDate || format(endOfMonth(selectedDate), "yyyy-MM-dd"),
    },
  });

  // Mutation para criar agendamento
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Converter os dados para o formato esperado pela API
      const apiData = {
        gradeId: parseInt(data.gradeId),
        gradeClass: data.gradeClass,
        teacherName: data.teacherName,
        date: data.date,
        timeSlotId: parseInt(data.timeSlotId),
        content: data.content,
        equipmentId: parseInt(data.equipmentId),
        notes: data.notes,
        isRecurring: data.isRecurring,
        recurringFrequency: data.recurringFrequency,
        recurringEndDate: data.isRecurring ? data.recurringEndDate : undefined,
      };
      
      const res = await apiRequest("POST", "/api/schedules", apiData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules/date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules/upcoming"] });
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar agendamento
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editSchedule) return null;
      
      const apiData = {
        gradeId: parseInt(data.gradeId),
        gradeClass: data.gradeClass,
        teacherName: data.teacherName,
        date: data.date,
        timeSlotId: parseInt(data.timeSlotId),
        content: data.content,
        equipmentId: parseInt(data.equipmentId),
        notes: data.notes,
        isRecurring: data.isRecurring,
        recurringFrequency: data.recurringFrequency,
        recurringEndDate: data.isRecurring ? data.recurringEndDate : undefined,
      };
      
      const res = await apiRequest("PUT", `/api/schedules/${editSchedule.id}`, apiData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules/date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules/upcoming"] });
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Envio do formulário
  const onSubmit = (values: FormValues) => {
    if (editSchedule) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[88vh] max-h-[90vh] overflow-y-auto p-4 pt-6">
        <DialogHeader>
          <DialogTitle>{editSchedule ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto pr-1 flex-1 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper" 
                        side="bottom" 
                        align="start"
                        className="z-50 max-h-56"
                      >
                        {Object.values(GRADES)
                          .filter(grade => grade.period === period)
                          .map((grade) => (
                          <SelectItem 
                            key={grade.id} 
                            value={grade.id.toString()}
                          >
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper" 
                        side="bottom" 
                        align="start"
                        className="z-50 max-h-56"
                      >
                        {form.watch("gradeId") && 
                         Object.values(GRADES)
                          .find(g => g.id.toString() === form.watch("gradeId"))
                          ?.classes.map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do professor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper" 
                        side="bottom" 
                        align="start"
                        className="z-50 max-h-56"
                      >
                        {(period === 'morning' ? MORNING_TIME_SLOTS : 
                          period === 'afternoon' ? AFTERNOON_TIME_SLOTS : 
                          NIGHT_TIME_SLOTS).map((slot) => (
                          <SelectItem 
                            key={slot.id} 
                            value={slot.id.toString()}
                          >
                            {slot.start} - {slot.end}
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
                name="equipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o equipamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper" 
                        side="bottom" 
                        align="start"
                        className="z-50 max-h-56"
                      >
                        {EQUIPMENT_TYPES.map((item) => (
                          <SelectItem 
                            key={item.id} 
                            value={item.id.toString()}
                          >
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Input placeholder="O que será estudado?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="col-span-2">
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
              </div>

              {/* Seção de agendamento recorrente */}
              <div className="col-span-2 border-2 border-primary/20 rounded-lg p-4 mt-6 mb-8 bg-primary/5">
                <h3 className="font-medium mb-3 text-primary text-lg flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9 -9a9 9 0 0 1 6 2.3l3 2.7"></path>
                  </svg>
                  Opções de Recorrência
                </h3>
                
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5 data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium text-base">Repetir este agendamento</FormLabel>
                        <p className="text-sm text-muted-foreground">Marque esta opção para criar um agendamento que se repete automaticamente</p>
                      </div>
                    </FormItem>
                  )}
                />
                
                {form.watch("isRecurring") && (
                  <div className="ml-0 p-4 border border-primary/20 rounded-md bg-white space-y-4 shadow-sm">
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
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecione a frequência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent
                              position="popper" 
                              side="bottom" 
                              align="start"
                              className="z-50 max-h-56"
                            >
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
                          <FormLabel>Data final da recorrência (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={format(addDays(selectedDate, 7), "yyyy-MM-dd")}
                              max={format(endOfMonth(addDays(selectedDate, 90)), "yyyy-MM-dd")}
                              className="bg-white"
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
            </div>
            
            <div className="pt-4 pb-0 bg-white border-t mt-4">
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>Salvando...</>
                  ) : (
                    <>{editSchedule ? "Atualizar" : "Salvar"}</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}