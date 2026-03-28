"use client";

import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type ExportFormat = "excel" | "pdf" | "csv";

interface ExportButtonsProps {
  disabled?: boolean;
  onExport: (format: ExportFormat) => Promise<void> | void;
  className?: string;
}

export const ExportButtons = ({ disabled, onExport, className }: ExportButtonsProps) => {
  const handleClick = async (format: ExportFormat) => {
    if (disabled) return;
    await onExport(format);
  };
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => handleClick("excel")}>
        <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
      </Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => handleClick("pdf")}>
        <FileText className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => handleClick("csv")}>
        <FileDown className="mr-2 h-4 w-4" /> CSV
      </Button>
    </div>
  );
};
