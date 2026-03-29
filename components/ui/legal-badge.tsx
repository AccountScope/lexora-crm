import { cn } from "@/lib/utils";
import { LEGAL_STATUS_COLORS, PRACTICE_AREA_COLORS } from "@/lib/legal-utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LegalBadgeProps {
  type: 'status' | 'practice-area';
  value: string;
  tooltip?: string;
  className?: string;
}

export function LegalBadge({ type, value, tooltip, className }: LegalBadgeProps) {
  const normalizedValue = value.toLowerCase().replace(/\s+/g, '-');
  
  let colorClass = '';
  if (type === 'status') {
    colorClass = LEGAL_STATUS_COLORS[normalizedValue as keyof typeof LEGAL_STATUS_COLORS] || 
                 LEGAL_STATUS_COLORS['active'];
  } else if (type === 'practice-area') {
    colorClass = PRACTICE_AREA_COLORS[normalizedValue as keyof typeof PRACTICE_AREA_COLORS] || 
                 PRACTICE_AREA_COLORS['other'];
  }

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(colorClass, "font-medium", className)}
    >
      {value}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
