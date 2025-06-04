import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ScheduleForm from "@/components/schedule/ScheduleForm";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGradeColorClass, Schedule } from "@shared/schema";
import { CalendarIcon } from "lucide-react";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  
  // Fetch schedules for the selected month to display as highlighted days
  const month = date ? format(date, "yyyy-MM") : format(new Date(), "yyyy-MM");
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;
  
  const { data: schedules } = useQuery({
    queryKey: [`/api/schedules/range?startDate=${startDate}&endDate=${endDate}`],
  });
  
  // Create a set of dates with schedules for O(1) lookup
  const datesWithSchedules = new Set();
  schedules?.forEach((schedule: Schedule) => {
    datesWithSchedules.add(schedule.date);
  });
  
  // Function to determine if a date has schedules
  const hasSchedulesOnDate = (date: Date) => {
    return datesWithSchedules.has(format(date, "yyyy-MM-dd"));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="md:ml-64 flex-1">
        <Header openAddScheduleModal={() => setModalOpen(true)} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Calendário de Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={pt}
                    modifiers={{
                      booked: (date) => hasSchedulesOnDate(date),
                    }}
                    modifiersClassNames={{
                      booked: "bg-primary text-primary-foreground font-bold",
                    }}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {date && (
                  <div>
                    <h3 className="font-medium mb-4">
                      {format(date, "d 'de' MMMM, yyyy", { locale: pt })}
                    </h3>
                    
                    <div className="space-y-3">
                      {schedules?.filter((s: Schedule) => 
                        s.date === format(date, "yyyy-MM-dd")
                      ).length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          Não há agendamentos para este dia.
                        </p>
                      ) : (
                        schedules?.filter((s: Schedule) => 
                          s.date === format(date, "yyyy-MM-dd")
                        ).map((schedule: Schedule) => (
                          <div 
                            key={schedule.id} 
                            className={`p-3 rounded-md border-l-4 border-${getGradeColorClass(schedule.gradeId)}`}
                          >
                            <div className="font-medium">{schedule.teacherName}</div>
                            <div className="text-sm text-gray-500">
                              {`${schedule.content}`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setModalOpen(true)} 
                      className="mt-4 w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      Agendar para este dia
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <ScheduleForm 
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={date || new Date()}
        />
      </main>
    </div>
  );
}
