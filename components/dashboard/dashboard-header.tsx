"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Download, Plus, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardHeaderProps {
  userName?: string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onExport?: () => void;
}

export function DashboardHeader({
  userName = "there",
  timeRange,
  onTimeRangeChange,
  onExport,
}: DashboardHeaderProps) {
  const getCurrentTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      {/* Title & Greeting */}
      <div>
        <h1 className="text-h1 text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-body text-gray-600 dark:text-gray-400">
          Good {getCurrentTime()}, <span className="font-semibold">{userName}</span>. 
          Here's what's happening with your practice today.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Time Range Selector */}
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        {onExport && (
          <Button
            variant="outline"
            size="default"
            onClick={onExport}
            className="rounded-xl gap-2 hidden sm:flex"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}

        {/* Quick Actions Dropdown */}
        <Button
          size="default"
          className="rounded-xl gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Action</span>
        </Button>
      </div>
    </div>
  );
}
