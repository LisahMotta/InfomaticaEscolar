import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { 
  Schedule, 
  getGradeColorClass, 
  getTimeSlot,
  getGradeName,
  EQUIPMENT_TYPES,
  UserRole,
  GRADES
} from "@shared/schema";
import { format, parseISO, isToday, isTomorrow, isThisWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import ScheduleForm from "@/components/schedule/ScheduleForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationToggle from "@/components/notifications/NotificationToggle";
import SendNotificationForm from "@/components/notifications/SendNotificationForm";
import { useAuth } from "@/hooks/use-auth";
import PeriodToggle from "@/components/schedule/PeriodToggle";

export default function Notifications() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("upcoming");
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'night'>('afternoon');
  const { user } = useAuth();
  
  // Fetch all upcoming schedules
  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules/upcoming?limit=100'],
  });
  
  // Filtrar agendamentos por período (manhã, tarde ou noite)
  const filterByPeriod = (schedules: Schedule[] | undefined, period: 'morning' | 'afternoon' | 'night'): Schedule[] => {
    if (!schedules) return [];
    return schedules.filter(s => {
      // Encontrar o objeto correspondente ao ID da turma
      const gradeValues = Object.values(GRADES);
      const gradeObj = gradeValues.find(g => g.id === s.gradeId);
      // Verificar se o período da turma corresponde ao período solicitado
      return gradeObj?.period === period;
    });
  };
  
  // Obter agendamentos para cada período
  const morningSchedules = filterByPeriod(schedules, 'morning');
  const afternoonSchedules = filterByPeriod(schedules, 'afternoon');
  const nightSchedules = filterByPeriod(schedules, 'night');
  
  // Obter agendamentos do período selecionado
  const currentPeriodSchedules = filterByPeriod(schedules, period);
  
  // Group schedules by timeframe (apenas para o período selecionado)
  const todaySchedules = currentPeriodSchedules.filter((s: Schedule) => 
    isToday(parseISO(s.date))
  ) || [];
  
  const tomorrowSchedules = currentPeriodSchedules.filter((s: Schedule) => 
    isTomorrow(parseISO(s.date))
  ) || [];
  
  const thisWeekSchedules = currentPeriodSchedules.filter((s: Schedule) => 
    !isToday(parseISO(s.date)) && 
    !isTomorrow(parseISO(s.date)) && 
    isThisWeek(parseISO(s.date))
  ) || [];
  
  const laterSchedules = currentPeriodSchedules.filter((s: Schedule) => 
    !isToday(parseISO(s.date)) && 
    !isTomorrow(parseISO(s.date)) && 
    !isThisWeek(parseISO(s.date))
  ) || [];
  
  // Function to format the date for display
  const formatScheduleDate = (schedule: Schedule) => {
    const scheduleDate = parseISO(schedule.date);
    const timeSlot = getTimeSlot(schedule.timeSlotId);
    
    if (isToday(scheduleDate)) {
      return `Hoje, ${timeSlot?.start || ''}`;
    } else if (isTomorrow(scheduleDate)) {
      return `Amanhã, ${timeSlot?.start || ''}`;
    } else {
      return `${format(scheduleDate, 'EEEE, d MMM', { locale: pt })}, ${timeSlot?.start || ''}`;
    }
  };
  
  // Function to get grade display name
  const getGradeDisplayName = (gradeId: number, gradeClass: string) => {
    // Buscar o objeto correspondente na lista de turmas
    const gradeObj = Object.values(GRADES).find(g => g.id === gradeId);
    // Retornar o nome completo com a classe
    return `${gradeObj?.name || 'Turma'} ${gradeClass}`;
  };
  
  // Function to get equipment name
  const getEquipmentName = (equipmentId: number) => {
    return EQUIPMENT_TYPES.find(e => e.id === equipmentId)?.name || '';
  };
  
  // Render schedule card
  const renderScheduleCard = (schedule: Schedule) => (
    <Card 
      key={schedule.id} 
      className="mb-3 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start">
        <div className={`w-3 h-3 rounded-full mt-1 mr-3 flex-shrink-0 bg-${getGradeColorClass(schedule.gradeId)}`}></div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <h3 className="font-medium text-gray-900">
              {getGradeDisplayName(schedule.gradeId, schedule.gradeClass)} - {schedule.teacherName}
            </h3>
            <span className="text-sm text-gray-500 md:ml-4">
              {formatScheduleDate(schedule)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {schedule.content} - {getEquipmentName(schedule.equipmentId)}
          </p>
          {schedule.notes && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Observações: {schedule.notes}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
  
  // Render loading skeleton
  const renderSkeletons = (count: number) => (
    Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="mb-3 p-4">
        <div className="flex items-start">
          <div className="w-3 h-3 rounded-full bg-gray-200 mt-1 mr-3"></div>
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Card>
    ))
  );

  // Total de notificações para todos os períodos
  const totalNotifications = 
    filterByPeriod(schedules, 'morning').filter(s => isToday(parseISO(s.date))).length +
    filterByPeriod(schedules, 'afternoon').filter(s => isToday(parseISO(s.date))).length +
    filterByPeriod(schedules, 'night').filter(s => isToday(parseISO(s.date))).length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar notificationCount={totalNotifications} />
      
      <main className="md:ml-64 flex-1">
        <Header openAddScheduleModal={() => setModalOpen(true)} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Componente de ativação de notificações */}
          <div className="mb-6">
            <NotificationToggle />
          </div>

          {/* Componente de envio de notificações para PROATI */}
          {user?.role === UserRole.PROATI && (
            <div className="mb-6">
              <SendNotificationForm />
            </div>
          )}

          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">Notificações e Próximas Aulas</h1>
            </div>
            
            <Tabs defaultValue="upcoming" value={tab} onValueChange={setTab}>
              <div className="px-6 pt-4">
                <TabsList className="w-full justify-start border-b mb-0 rounded-none bg-transparent p-0 space-x-4">
                  <TabsTrigger 
                    value="upcoming" 
                    className="pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none bg-transparent"
                  >
                    Próximas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="today" 
                    className="pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none bg-transparent"
                  >
                    Hoje
                    {todaySchedules.length > 0 && (
                      <span className="ml-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {todaySchedules.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tomorrow" 
                    className="pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none bg-transparent"
                  >
                    Amanhã
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week" 
                    className="pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none data-[state=active]:shadow-none bg-transparent"
                  >
                    Esta Semana
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="upcoming" className="mt-0">
                  {/* Period Selector */}
                  <div className="mb-6">
                    <PeriodToggle value={period} onChange={setPeriod} />
                    
                    {/* Period Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <p className="text-xs text-amber-800 mb-1">Manhã</p>
                        <p className="text-lg font-semibold text-amber-900">{morningSchedules.length}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-800 mb-1">Tarde</p>
                        <p className="text-lg font-semibold text-blue-900">{afternoonSchedules.length}</p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-indigo-800 mb-1">Noite</p>
                        <p className="text-lg font-semibold text-indigo-900">{nightSchedules.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {isLoading ? renderSkeletons(5) : (
                    currentPeriodSchedules.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Não há agendamentos próximos para o período selecionado.
                      </p>
                    ) : (
                      <>
                        {todaySchedules.length > 0 && (
                          <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Hoje
                            </h2>
                            {todaySchedules.map(renderScheduleCard)}
                          </div>
                        )}
                        
                        {tomorrowSchedules.length > 0 && (
                          <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Amanhã
                            </h2>
                            {tomorrowSchedules.map(renderScheduleCard)}
                          </div>
                        )}
                        
                        {thisWeekSchedules.length > 0 && (
                          <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Esta Semana
                            </h2>
                            {thisWeekSchedules.map(renderScheduleCard)}
                          </div>
                        )}
                        
                        {laterSchedules.length > 0 && (
                          <div>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Mais Tarde
                            </h2>
                            {laterSchedules.map(renderScheduleCard)}
                          </div>
                        )}
                      </>
                    )
                  )}
                </TabsContent>
                
                <TabsContent value="today" className="mt-0">
                  {isLoading ? renderSkeletons(3) : (
                    todaySchedules.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Não há agendamentos para hoje.
                      </p>
                    ) : (
                      todaySchedules.map(renderScheduleCard)
                    )
                  )}
                </TabsContent>
                
                <TabsContent value="tomorrow" className="mt-0">
                  {isLoading ? renderSkeletons(3) : (
                    tomorrowSchedules.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Não há agendamentos para amanhã.
                      </p>
                    ) : (
                      tomorrowSchedules.map(renderScheduleCard)
                    )
                  )}
                </TabsContent>
                
                <TabsContent value="week" className="mt-0">
                  {isLoading ? renderSkeletons(3) : (
                    thisWeekSchedules.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Não há mais agendamentos para esta semana.
                      </p>
                    ) : (
                      thisWeekSchedules.map(renderScheduleCard)
                    )
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
        
        <ScheduleForm 
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={new Date()}
          period={period}
        />
      </main>
    </div>
  );
}
