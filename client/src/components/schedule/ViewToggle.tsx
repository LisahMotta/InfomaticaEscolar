import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ViewToggleProps {
  view: 'day' | 'week';
  onViewChange: (view: 'day' | 'week') => void;
  selectedEquipment: string;
  onEquipmentChange: (equipment: string) => void;
  onPrintClick?: () => void;
}

export default function ViewToggle({ 
  view, 
  onViewChange, 
  selectedEquipment, 
  onEquipmentChange,
  onPrintClick
}: ViewToggleProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-2">
          <button 
            className={cn(
              "py-2 px-4", 
              view === 'day' 
                ? "text-primary font-medium border-b-2 border-primary" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => onViewChange('day')}
          >
            Dia
          </button>
          <button 
            className={cn(
              "py-2 px-4", 
              view === 'week' 
                ? "text-primary font-medium border-b-2 border-primary" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => onViewChange('week')}
          >
            Semana
          </button>
          
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={onPrintClick}
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Agenda</span>
            </Button>
            
            <Select
              value={selectedEquipment}
              onValueChange={onEquipmentChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os equipamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os equipamentos</SelectItem>
                <SelectItem value="1">Chromebooks</SelectItem>
                <SelectItem value="2">Laboratório</SelectItem>
                <SelectItem value="3">Tablets</SelectItem>
                <SelectItem value="4">Projetor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
