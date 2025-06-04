import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LightbulbIcon, SunIcon, MoonIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PeriodToggleProps {
  value: 'morning' | 'afternoon' | 'night';
  onChange: (value: 'morning' | 'afternoon' | 'night') => void;
}

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-sm font-semibold mb-2 text-gray-500">Selecionar Período</h3>
      
      <ToggleGroup type="single" value={value} onValueChange={(val) => {
        if (val === 'morning' || val === 'afternoon' || val === 'night') {
          onChange(val);
        }
      }}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="morning" 
                className={`flex items-center gap-1 ${value === 'morning' ? 'bg-amber-100 text-amber-900' : ''}`}
              >
                <SunIcon className="h-4 w-4" />
                <span className="hidden md:inline">Manhã</span>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manhã (Anos Finais)</p>
              <p className="text-xs text-gray-500">07:00 - 12:20</p>
              <p className="text-xs text-gray-500">Intervalo: 09:30 - 09:50</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="afternoon" 
                className={`flex items-center gap-1 ${value === 'afternoon' ? 'bg-blue-100 text-blue-900' : ''}`}
              >
                <LightbulbIcon className="h-4 w-4" />
                <span className="hidden md:inline">Tarde</span>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tarde (Anos Iniciais)</p>
              <p className="text-xs text-gray-500">13:00 - 18:20</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="night" 
                className={`flex items-center gap-1 ${value === 'night' ? 'bg-indigo-100 text-indigo-900' : ''}`}
              >
                <MoonIcon className="h-4 w-4" />
                <span className="hidden md:inline">Noite</span>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Noite (Ensino Médio)</p>
              <p className="text-xs text-gray-500">18:50 - 22:50</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ToggleGroup>
    </div>
  );
}