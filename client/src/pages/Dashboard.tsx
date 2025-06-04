import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import WeekNavigation from "@/components/schedule/WeekNavigation";
import ViewToggle from "@/components/schedule/ViewToggle";
import PeriodToggle from "@/components/schedule/PeriodToggle";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import UpcomingClasses from "@/components/schedule/UpcomingClasses";
import ScheduleForm from "@/components/schedule/ScheduleFormNew";
import PrintSchedule from "@/components/schedule/PrintSchedule";
import { Schedule, UserRole } from "@shared/schema";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get grade filter from URL if present
  const gradeFromUrl = new URLSearchParams(location.split("?")[1]).get("grade");
  
  // Se o usuário for professor, forçar filtro para a turma dele
  const isTeacher = user?.role === UserRole.TEACHER;
  const teacherClass = user?.assignedClass;
  
  // Se for professor, extrair gradeId da classe (primeiro caractere)
  const teacherGradeId = isTeacher && teacherClass ? parseInt(teacherClass.charAt(0)) : null;
  
  // Grade final: se for professor, usa a turma dele, senão usa da URL se existir
  const grade = isTeacher ? String(teacherGradeId) : gradeFromUrl || undefined;
  
  // State variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [equipment, setEquipment] = useState('all');
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'night'>('afternoon'); // Estado para controlar o período
  const [modalOpen, setModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | undefined>();
  const [editSchedule, setEditSchedule] = useState<Schedule | undefined>();
  
  // Fetch notification count
  const { data: upcomingSchedules = [] } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules/upcoming'],
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/schedules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/date/${currentDate.toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/upcoming'] });
      toast({
        title: "Agendamento removido",
        description: "O agendamento foi removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível remover o agendamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Complete/Incomplete mutation
  const completeMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      const response = await apiRequest("PATCH", `/api/schedules/${id}/complete`, { isCompleted });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/date/${currentDate.toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/upcoming'] });
      toast({
        title: data.isCompleted ? "Aula marcada como efetuada" : "Aula marcada como não efetuada",
        description: data.isCompleted 
          ? "A aula foi marcada como efetuada com sucesso!" 
          : "A marcação de efetuada foi removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o status da aula: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handlers com verificações de permissão
  const handleAddSchedule = (timeSlotId: number) => {
    // Coordenadores não podem criar agendamentos
    if (user?.role === UserRole.COORDINATOR) {
      toast({
        title: "Acesso negado",
        description: "Coordenadores não podem criar agendamentos.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedTimeSlot(timeSlotId);
    setEditSchedule(undefined);
    setModalOpen(true);
  };
  
  const handleEditSchedule = (schedule: Schedule) => {
    // Coordenadores não podem editar agendamentos
    if (user?.role === UserRole.COORDINATOR) {
      toast({
        title: "Acesso negado",
        description: "Coordenadores não podem editar agendamentos.",
        variant: "destructive"
      });
      return;
    }
    
    // Professores só podem editar agendamentos da própria turma
    if (isTeacher) {
      const scheduleGradeId = schedule.gradeId;
      const scheduleClass = schedule.gradeClass;
      
      if (teacherGradeId !== scheduleGradeId || 
          teacherClass?.charAt(1) !== scheduleClass) {
        toast({
          title: "Acesso negado",
          description: "Você só pode editar agendamentos da sua turma.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setEditSchedule(schedule);
    setSelectedTimeSlot(undefined);
    setModalOpen(true);
  };
  
  const handleDeleteSchedule = (id: number) => {
    // Coordenadores não podem excluir agendamentos
    if (user?.role === UserRole.COORDINATOR) {
      toast({
        title: "Acesso negado",
        description: "Coordenadores não podem excluir agendamentos.",
        variant: "destructive"
      });
      return;
    }
    
    // Para professores, verificamos se é da turma deles no backend
    deleteMutation.mutate(id);
  };
  
  const handleCompleteSchedule = (id: number, isCompleted: boolean) => {
    // Coordenadores não podem marcar agendamentos como completados
    if (user?.role === UserRole.COORDINATOR) {
      toast({
        title: "Acesso negado",
        description: "Coordenadores não podem marcar aulas como efetuadas.",
        variant: "destructive"
      });
      return;
    }
    
    completeMutation.mutate({ id, isCompleted });
  };
  
  // Filter by grade if provided in URL
  useEffect(() => {
    if (grade) {
      setEquipment('all'); // Reset equipment filter when filtering by grade
    }
  }, [grade]);
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar notificationCount={upcomingSchedules?.length || 0} />
      
      <main className="md:ml-64 flex-1">
        <Header openAddScheduleModal={() => {
          // Verificar se é coordenador (não pode adicionar)
          if (user?.role === UserRole.COORDINATOR) {
            toast({
              title: "Acesso negado",
              description: "Coordenadores não podem criar agendamentos.",
              variant: "destructive"
            });
            return;
          }
          
          setSelectedTimeSlot(undefined);
          setEditSchedule(undefined);
          setModalOpen(true);
        }} />
        
        <WeekNavigation 
          currentDate={currentDate} 
          onDateChange={setCurrentDate} 
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-4 mb-2">
          <div className="flex-1">
            <ViewToggle 
              view={view} 
              onViewChange={setView} 
              selectedEquipment={equipment}
              onEquipmentChange={setEquipment}
              onPrintClick={() => setPrintModalOpen(true)}
            />
          </div>
          
          <div className="w-full md:w-auto">
            <PeriodToggle
              value={period}
              onChange={setPeriod}
            />
          </div>
        </div>
        
        <ScheduleGrid 
          date={currentDate}
          onAddSchedule={handleAddSchedule}
          onEditSchedule={handleEditSchedule}
          onDeleteSchedule={handleDeleteSchedule}
          onCompleteSchedule={handleCompleteSchedule}
          equipmentFilter={equipment}
          gradeFilter={grade}
          period={period}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <UpcomingClasses limit={3} />
        </div>
        
        <ScheduleForm 
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={currentDate}
          selectedTimeSlot={selectedTimeSlot}
          editSchedule={editSchedule}
          period={period}
        />
        
        {/* Componente de impressão da agenda semanal */}
        <PrintSchedule 
          currentDate={currentDate}
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          period={period}
        />
      </main>
    </div>
  );
}
