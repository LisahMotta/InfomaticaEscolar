import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { addDays, formatISO, format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

interface WeekNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function WeekNavigation({ currentDate, onDateChange }: WeekNavigationProps) {
  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  // Calculate the week start (Monday) and end (Friday)
  useEffect(() => {
    // Get start of week (Monday)
    let weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    // Generate array of weekdays (Mon-Fri)
    const dates = [];
    for (let i = 0; i < 5; i++) {
      dates.push(addDays(weekStart, i));
    }
    setWeekDates(dates);
  }, [currentDate]);
  
  // Format week range for display (e.g., "12 a 16 de Junho, 2023")
  const weekRangeDisplay = weekDates.length 
    ? `${format(weekDates[0], "d", { locale: pt })} a ${format(weekDates[4], "d 'de' MMMM, yyyy", { locale: pt })}` 
    : "";
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    onDateChange(addDays(currentDate, -7));
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    onDateChange(addDays(currentDate, 7));
  };
  
  // Select a specific day
  const selectDay = (date: Date) => {
    onDateChange(date);
  };
  
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={goToPreviousWeek}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">{weekRangeDisplay}</h2>
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={goToNextWeek}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex border-b border-t overflow-x-auto">
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === currentDate.toDateString();
            const dayLabel = weekdays[index];
            const dayNumber = format(date, "d");
            
            return (
              <button 
                key={format(date, "yyyy-MM-dd")}
                className={cn(
                  "flex-1 text-center py-3 min-w-[80px]",
                  isSelected 
                    ? "border-b-2 border-primary text-primary font-medium" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
                onClick={() => selectDay(date)}
              >
                <div className="text-sm">{dayLabel}</div>
                <div className="text-lg">{dayNumber}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
