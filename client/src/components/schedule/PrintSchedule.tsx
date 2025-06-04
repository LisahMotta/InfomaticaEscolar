import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  Schedule, 
  TIME_SLOTS,
  MORNING_TIME_SLOTS,
  AFTERNOON_TIME_SLOTS,
  NIGHT_TIME_SLOTS,
  EQUIPMENT_TYPES,
  getGradeColorClass,
  getTimeSlot,
  getEquipmentName,
  getGradeName
} from "@shared/schema";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintScheduleProps {
  currentDate: Date;
  isOpen: boolean;
  onClose: () => void;
  period: 'morning' | 'afternoon' | 'night';
}

export default function PrintSchedule({ 
  currentDate, 
  isOpen, 
  onClose,
  period
}: PrintScheduleProps) {
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [schedulesByDay, setSchedulesByDay] = useState<{[key: string]: Schedule[]}>({});

  // Generate array of weekdays (Mon-Fri)
  useEffect(() => {
    if (!isOpen) return;
    
    // Get start of week (Monday)
    let weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      dates.push(addDays(weekStart, i));
    }
    setWeekDates(dates);
  }, [currentDate, isOpen]);

  // Format dates for API
  const startDate = weekDates.length ? format(weekDates[0], "yyyy-MM-dd") : "";
  const endDate = weekDates.length ? format(weekDates[4], "yyyy-MM-dd") : "";

  // Fetch schedules for the week
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['/api/schedules/range', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const response = await fetch(`/api/schedules/range?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Falha ao carregar agendamentos da semana');
      return response.json();
    },
    enabled: isOpen && !!startDate && !!endDate,
  });

  // Organize schedules by day
  useEffect(() => {
    if (!schedules) return;
    
    const byDay: {[key: string]: Schedule[]} = {};
    
    weekDates.forEach(date => {
      const dateKey = format(date, "yyyy-MM-dd");
      byDay[dateKey] = [];
    });
    
    schedules.forEach((schedule: Schedule) => {
      if (byDay[schedule.date]) {
        byDay[schedule.date].push(schedule);
      }
    });
    
    setSchedulesByDay(byDay);
  }, [schedules, weekDates]);

  // Print the schedule
  const handlePrint = () => {
    window.print();
  };

  // Get teacher name and class name for display
  const getScheduleDisplayName = (schedule: Schedule) => {
    return `${schedule.teacherName} - ${getGradeName(schedule.gradeId)} ${schedule.gradeClass}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto print:static print:overflow-visible print-container">
      {/* Header with controls - hidden when printing */}
      <div className="bg-primary text-white p-4 flex justify-between items-center print-hidden">
        <h2 className="text-xl font-bold">
          Impressão da Agenda Semanal
          <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
            {period === 'morning' ? 'Manhã (Anos Finais)' : 
             period === 'afternoon' ? 'Tarde (Anos Iniciais)' : 
             'Noite (Ensino Médio)'}
          </span>
        </h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="bg-white text-primary hover:bg-gray-100"
            onClick={handlePrint}
          >
            Imprimir
          </Button>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-primary-dark"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Print title - shown only when printing */}
      <div className="hidden print:block text-center mb-4 mt-4">
        <h1 className="text-2xl font-bold">Sala de Informática</h1>
        <h2 className="text-xl">
          Agenda da Semana: {weekDates.length ? 
            `${format(weekDates[0], "d", { locale: pt })} a ${format(weekDates[4], "d 'de' MMMM, yyyy", { locale: pt })}` 
            : ""}
        </h2>
        <h3 className="text-lg font-medium mt-1">
          {period === 'morning' ? 'Período: Manhã (Anos Finais)' : 
           period === 'afternoon' ? 'Período: Tarde (Anos Iniciais)' : 
           'Período: Noite (Ensino Médio)'}
          <span className="text-sm ml-2 text-gray-600">
            {period === 'morning' ? '07:00 - 12:20' : 
             period === 'afternoon' ? '13:00 - 18:20' : 
             '18:50 - 22:50'}
          </span>
        </h3>
      </div>

      {/* Schedule Grid */}
      <div className="p-6 print:p-0">
        {isLoading ? (
          <div className="text-center p-10">Carregando agendamentos da semana...</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-100">Horário</th>
                {weekDates.map((date) => (
                  <th key={date.toString()} className="border p-2 bg-gray-100">
                    <div>{format(date, "EEEE", { locale: pt })}</div>
                    <div>{format(date, "dd/MM", { locale: pt })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(period === 'morning' ? MORNING_TIME_SLOTS : 
                period === 'afternoon' ? AFTERNOON_TIME_SLOTS : 
                NIGHT_TIME_SLOTS).map((timeSlot) => (
                <tr key={timeSlot.id}>
                  <td className="border p-2 text-center font-medium bg-gray-50">
                    {timeSlot.start} - {timeSlot.end}
                  </td>
                  
                  {weekDates.map((date) => {
                    const dateKey = format(date, "yyyy-MM-dd");
                    const daySchedules = schedulesByDay[dateKey] || [];
                    const schedule = daySchedules.find(s => s.timeSlotId === timeSlot.id);
                    
                    return (
                      <td key={date.toString()} className="border p-2">
                        {schedule ? (
                          <div className={`p-2 rounded ${schedule.gradeId ? `bg-${getGradeColorClass(schedule.gradeId)}-light` : ''}`}>
                            <div className="font-medium">{getScheduleDisplayName(schedule)}</div>
                            <div className="text-sm">
                              <div><span className="text-gray-500">Conteúdo:</span> {schedule.content}</div>
                              <div><span className="text-gray-500">Equipamento:</span> {getEquipmentName(schedule.equipmentId)}</div>
                              {schedule.notes && (
                                <div><span className="text-gray-500">Observações:</span> {schedule.notes}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-2">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}