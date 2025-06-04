import { useQuery } from "@tanstack/react-query";
import { Schedule, getGradeColorClass, getTimeSlot, getEquipmentName } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface UpcomingClassesProps {
  limit?: number;
}

export default function UpcomingClasses({ limit = 3 }: UpcomingClassesProps) {
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: [`/api/schedules/upcoming?limit=${limit}`],
  });

  // Function to format the date for display
  const formatScheduleDate = (date: string, timeSlotId: number) => {
    const timeSlot = getTimeSlot(timeSlotId);
    
    if (!timeSlot) return "";

    const scheduleDate = parseISO(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Display "Hoje" or "Amanhã" if applicable
    if (format(scheduleDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return `Hoje, ${timeSlot.start}`;
    } else if (format(scheduleDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return `Amanhã, ${timeSlot.start}`;
    } else {
      // Otherwise show the day of week
      return `${format(scheduleDate, 'EEEE', { locale: pt })}, ${timeSlot.start}`;
    }
  };

  // Function to get grade display name
  const getGradeDisplayName = (gradeId: number, gradeClass: string) => {
    switch (gradeId) {
      case 1: return `1° Ano ${gradeClass}`;
      case 2: return `2° Ano ${gradeClass}`;
      case 3: return `3° Ano ${gradeClass}`;
      case 4: return `4° Ano ${gradeClass}`;
      case 5: return `5° Ano ${gradeClass}`;
      default: return `Turma ${gradeClass}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Próximas Aulas</h3>
        <Link href="/notifications">
          <a className="text-sm text-primary hover:text-primary-dark">
            Ver todas
          </a>
        </Link>
      </div>
      
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          // Loading state
          Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="p-4">
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-gray-200 mt-2 mr-3"></div>
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="p-4 text-center text-red-500">
            Erro ao carregar próximas aulas.
          </div>
        ) : schedules?.length === 0 ? (
          // Empty state
          <div className="p-4 text-center text-gray-500">
            Não há aulas agendadas para os próximos dias.
          </div>
        ) : (
          // Render upcoming schedules
          schedules?.map((schedule: Schedule) => (
            <div key={schedule.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className={`w-2 h-2 rounded-full bg-${getGradeColorClass(schedule.gradeId)} mt-2 mr-3`}></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-gray-900">
                      {getGradeDisplayName(schedule.gradeId, schedule.gradeClass)} - {schedule.teacherName}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatScheduleDate(schedule.date, schedule.timeSlotId)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {schedule.content} - {getEquipmentName(schedule.equipmentId)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
