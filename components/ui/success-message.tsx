import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessMessageProps {
  title: string;
  description?: string;
  className?: string;
}

export function SuccessMessage({ title, description, className }: SuccessMessageProps) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4", className)}>
      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-green-900">{title}</p>
        {description && (
          <p className="text-sm text-green-700 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
