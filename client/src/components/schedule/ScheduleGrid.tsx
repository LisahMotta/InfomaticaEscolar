import { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash, CheckCircle, CheckCircle2, Coffee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { 
  Schedule, 
  TIME_SLOTS,
  MORNING_TIME_SLOTS,
  AFTERNOON_TIME_SLOTS,
  NIGHT_TIME_SLOTS,
  GRADES, 
  EQUIPMENT_TYPES,
  BREAK_TIMES,
  getGradeColorClass 
} from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleGridProps {
  date: Date;
  onAddSchedule: (timeSlotId: number) => void;
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (id: number) => void;
  onCompleteSchedule?: (id: number, isCompleted: boolean) => void;
  equipmentFilter: string;
  gradeFilter?: string; // Adicionando filtro por série
  period: 'morning' | 'afternoon' | 'night'; // Período (manhã, tarde ou noite)
}

export default function ScheduleGrid({ 
  date, 
  onAddSchedule, 
  onEditSchedule, 
  onDeleteSchedule,
  onCompleteSchedule,
  equipmentFilter,
  gradeFilter,
  period
}: ScheduleGridProps) {
  const formattedDate = format(date, "yyyy-MM-dd");
  const dateDisplay = format(date, "EEEE, d 'de' MMMM", { locale: pt });
  
  // Fetch schedules for this date
  const { data: schedules = [], isLoading, error } = useQuery<Schedule[]>({
    queryKey: [`/api/schedules/date/${formattedDate}`],
  });
  
  // Filter schedules by equipment, grade and period
  const filteredSchedules = schedules.filter((schedule: Schedule) => {
    // Filtro por equipamento
    const matchesEquipment = equipmentFilter === 'all' || 
                            schedule.equipmentId.toString() === equipmentFilter;
    
    // Filtro por série (gradeId)
    const matchesGrade = !gradeFilter || 
                        schedule.gradeId.toString() === gradeFilter;
    
    // Filtro por período
    const gradeObj = Object.values(GRADES).find(g => g.id === schedule.gradeId);
    const matchesPeriod = gradeObj?.period === period;
    
    return matchesEquipment && matchesGrade && matchesPeriod;
  });
  
  // Function to get grade name from IDs
  const getGradeDisplayName = (gradeId: number, gradeClass: string) => {
    const grade = Object.values(GRADES).find(g => g.id === gradeId);
    return grade ? `${grade.name} ${gradeClass}` : '';
  };
  
  // Get equipment name from ID
  const getEquipmentName = (equipmentId: number) => {
    return EQUIPMENT_TYPES.find(e => e.id === equipmentId)?.name || '';
  };
  
  // Helper function to render a schedule cell
  const renderScheduleItem = (schedule: Schedule) => (
    <div className={`group bg-${getGradeColorClass(schedule.gradeId)}-light border-l-4 border-${getGradeColorClass(schedule.gradeId)} rounded p-3 h-full ${schedule.isCompleted ? 'opacity-75' : ''}`}>
      {schedule.isCompleted && (
        <div className="absolute top-1 right-1 text-green-600 font-medium text-xs px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-full">
          Efetuado
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <span className={`inline-block px-2 py-1 text-xs font-medium bg-${getGradeColorClass(schedule.gradeId)} text-white rounded mb-1`}>
            {getGradeDisplayName(schedule.gradeId, schedule.gradeClass)}
          </span>
          <h4 className="font-medium">{schedule.teacherName}</h4>
        </div>
        <div className="flex space-x-1">
          {onCompleteSchedule && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={`p-1 rounded hover:bg-gray-100 ${
                      schedule.isCompleted 
                        ? "text-green-600 hover:text-green-700" 
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    onClick={() => onCompleteSchedule(schedule.id, !schedule.isCompleted)}
                  >
                    {schedule.isCompleted 
                      ? <CheckCircle2 className="h-5 w-5" /> 
                      : <CheckCircle className="h-5 w-5" />
                    }
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {schedule.isCompleted ? "Marcar como não efetuado" : "Marcar como efetuado"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <button 
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            onClick={() => onEditSchedule(schedule)}
          >
            <Pencil className="h-5 w-5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-1 text-gray-500 hover:text-red-500 rounded hover:bg-gray-100">
                <Trash className="h-5 w-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover agendamento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover este agendamento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDeleteSchedule(schedule.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="text-sm mt-2">
        <div><span className="text-gray-600">Conteúdo:</span> {schedule.content}</div>
        <div><span className="text-gray-600">Equipamento:</span> {getEquipmentName(schedule.equipmentId)}</div>
      </div>
    </div>
  );
  
  // Helper function to render an empty slot
  const renderEmptySlot = (slotId: number) => (
    <div className="h-full flex items-center justify-center border border-dashed border-gray-300 rounded p-3 text-gray-400">
      <Button 
        variant="ghost" 
        className="text-primary flex items-center hover:bg-blue-50"
        onClick={() => onAddSchedule(slotId)}
      >
        <PlusCircle className="h-5 w-5 mr-1" />
        Agendar horário
      </Button>
    </div>
  );
  
  // Helper function to render a break time slot
  const renderBreakTime = (label: string, gradeIds: number[]) => (
    <div className="h-full flex items-center justify-center bg-gray-100 rounded p-2">
      <div className="flex flex-col items-center text-gray-600">
        <Coffee className="h-5 w-5 mb-1" />
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs">
          {gradeIds.map(id => Object.values(GRADES).find(g => g.id === id)?.name).join(", ")}
        </div>
      </div>
    </div>
  );
  
  // Define types for time slot items
  type BreakInfo = {
    start: string;
    end: string;
    label: string;
    gradeIds: number[];
  };
  
  type TimeSlotItem = 
    | { id: string; type: 'timeSlot'; slot: typeof TIME_SLOTS[0] }
    | { id: string; type: 'break'; breakInfo: BreakInfo };
  
  // Seleciona os horários corretos com base no período
  const currentTimeSlots = 
    period === 'morning' ? MORNING_TIME_SLOTS : 
    period === 'afternoon' ? AFTERNOON_TIME_SLOTS : 
    NIGHT_TIME_SLOTS;
  
  // Create an array of normal slots and break time slots in sequence
  const timeSlotItems: TimeSlotItem[] = [];
  
  // Add standard time slots with break slots in between
  currentTimeSlots.forEach((slot) => {
    // Add the regular time slot
    timeSlotItems.push({
      id: `slot-${slot.id}`,
      type: 'timeSlot',
      slot: slot
    });
    
    if (period === 'afternoon') {
      // Add break after slot 2 (14:40-15:00) for 4th and 5th grades
      if (slot.id === 2) {
        timeSlotItems.push({
          id: 'break-upper',
          type: 'break',
          breakInfo: {
            start: BREAK_TIMES.AFTERNOON_UPPER_GRADES.start,
            end: BREAK_TIMES.AFTERNOON_UPPER_GRADES.end,
            label: "Intervalo 4° e 5° anos",
            gradeIds: BREAK_TIMES.AFTERNOON_UPPER_GRADES.grades
          }
        });
      }
      
      // Add break after slot 3 (15:30-15:50) for 1st, 2nd and 3rd grades
      if (slot.id === 3) {
        timeSlotItems.push({
          id: 'break-lower',
          type: 'break',
          breakInfo: {
            start: BREAK_TIMES.AFTERNOON_LOWER_GRADES.start,
            end: BREAK_TIMES.AFTERNOON_LOWER_GRADES.end,
            label: "Intervalo 1°, 2° e 3° anos",
            gradeIds: BREAK_TIMES.AFTERNOON_LOWER_GRADES.grades
          }
        });
      }
    } else if (period === 'morning') {
      // Add break after morning slot 9 (08:40-09:30) - Intervalo (09:30-09:50)
      if (slot.id === 9) {
        timeSlotItems.push({
          id: 'break-morning',
          type: 'break',
          breakInfo: {
            start: BREAK_TIMES.MORNING_GRADES.start,
            end: BREAK_TIMES.MORNING_GRADES.end,
            label: "Intervalo Anos Finais",
            gradeIds: BREAK_TIMES.MORNING_GRADES.grades
          }
        });
      }
    } else { // period === 'night'
      // Add break after night slot 14 (19:35-20:20) - Intervalo (20:20-20:35)
      if (slot.id === 14) {
        timeSlotItems.push({
          id: 'break-night',
          type: 'break',
          breakInfo: {
            start: BREAK_TIMES.NIGHT_GRADES.start,
            end: BREAK_TIMES.NIGHT_GRADES.end,
            label: "Intervalo Ensino Médio",
            gradeIds: BREAK_TIMES.NIGHT_GRADES.grades
          }
        });
      }
    }
  });
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {dateDisplay}
          </h3>
        </div>
        
        {isLoading ? (
          // Loading state
          <>
            {currentTimeSlots.map((slot) => (
              <div key={slot.id} className="border-b border-gray-200">
                <div className="flex">
                  <div className="w-20 py-4 px-3 bg-gray-50 text-gray-700 text-center border-r border-gray-200">
                    <div className="font-semibold">{slot.start}</div>
                    <div className="text-xs text-gray-500">{slot.end}</div>
                  </div>
                  <div className="flex-1 p-2">
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          // Error state
          <div className="p-4 text-center text-red-500">
            Erro ao carregar agendamentos. Por favor, tente novamente.
          </div>
        ) : (
          // Render time slots with schedules and breaks
          <>
            {timeSlotItems.map((item) => {
              if (item.type === 'break') {
                // Render break time slot
                return (
                  <div key={item.id} className="border-b border-gray-200 bg-amber-50">
                    <div className="flex">
                      <div className="w-20 py-4 px-3 bg-amber-100 text-gray-700 text-center border-r border-gray-200">
                        <div className="font-semibold">{item.breakInfo.start}</div>
                        <div className="text-xs text-gray-500">{item.breakInfo.end}</div>
                      </div>
                      <div className="flex-1 p-2">
                        {renderBreakTime(item.breakInfo.label, item.breakInfo.gradeIds)}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // It's a regular time slot
                const slot = item.slot;
                const schedule = filteredSchedules?.find(
                  (s: Schedule) => s.timeSlotId === slot.id
                );
                
                return (
                  <div key={item.id} className="border-b border-gray-200">
                    <div className="flex">
                      <div className="w-20 py-4 px-3 bg-gray-50 text-gray-700 text-center border-r border-gray-200">
                        <div className="font-semibold">{slot.start}</div>
                        <div className="text-xs text-gray-500">{slot.end}</div>
                      </div>
                      <div className="flex-1 p-2">
                        {schedule 
                          ? renderScheduleItem(schedule) 
                          : renderEmptySlot(slot.id)
                        }
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </>
        )}
      </div>
    </div>
  );
}