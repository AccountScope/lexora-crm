"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  Clock,
  DollarSign,
  User,
  Calendar,
  MoreVertical,
  FileText,
  Upload,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MatterCardProps {
  matter: {
    id: string;
    title: string;
    matter_number: string;
    status: string;
    practice_area?: string;
    client_name?: string;
    created_at: string;
    deadline?: string;
    fee_estimate?: number;
    assigned_to?: string[];
  };
  onLogTime?: (matterId: string) => void;
  onUploadDoc?: (matterId: string) => void;
  onSendMessage?: (matterId: string) => void;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  "on-hold": {
    bg: "bg-gray-100 dark:bg-gray-800/30",
    text: "text-gray-800 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
  closed: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
};

export function MatterCard({
  matter,
  onLogTime,
  onUploadDoc,
  onSendMessage,
}: MatterCardProps) {
  const statusStyle = statusColors[matter.status?.toLowerCase()] || statusColors.active;

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link href={`/cases/${matter.id}`}>
      <Card className="group relative overflow-hidden border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
        <div className={cn("absolute left-0 top-0 h-full w-1", statusStyle.bg)} />
        
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold leading-none group-hover:text-primary transition-colors">
                  {matter.title}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {matter.matter_number}
                </Badge>
              </div>
              
              {matter.client_name && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{matter.client_name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                className={cn(
                  "capitalize",
                  statusStyle.bg,
                  statusStyle.text,
                  statusStyle.border
                )}
              >
                {matter.status}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    window.open(`/cases/${matter.id}`, '_blank');
                  }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in new tab
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    onLogTime?.(matter.id);
                  }}>
                    <Clock className="mr-2 h-4 w-4" />
                    Log time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    onUploadDoc?.(matter.id);
                  }}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    onSendMessage?.(matter.id);
                  }}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {matter.practice_area && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{matter.practice_area}</span>
              </div>
            )}

            {matter.deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Due {formatDistanceToNow(new Date(matter.deadline), { addSuffix: true })}
                </span>
              </div>
            )}

            {matter.fee_estimate && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                <span>
                  £{matter.fee_estimate.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 ml-auto text-xs">
              <Clock className="h-3 w-3" />
              <span>
                Created {formatDistanceToNow(new Date(matter.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Assigned Team Members */}
          {matter.assigned_to && matter.assigned_to.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                {matter.assigned_to.slice(0, 3).map((name, index) => (
                  <Avatar key={index} className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {matter.assigned_to.length > 3 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                    +{matter.assigned_to.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {matter.assigned_to.length === 1
                  ? "1 member"
                  : `${matter.assigned_to.length} members`}
              </span>
            </div>
          )}

          {/* Quick Actions (visible on hover) */}
          <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault();
                onLogTime?.(matter.id);
              }}
            >
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Log Time
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault();
                onUploadDoc?.(matter.id);
              }}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Add Document
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault();
                onSendMessage?.(matter.id);
              }}
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
