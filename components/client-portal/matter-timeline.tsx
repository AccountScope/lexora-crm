"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle, 
  CreditCard, 
  Calendar, 
  MessageCircle, 
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  createdAt: string;
  metadata?: any;
}

interface MatterTimelineProps {
  matterId: string;
  clientView?: boolean; // Hide internal events for clients
}

export function MatterTimeline({ matterId, clientView = false }: MatterTimelineProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["matter-timeline", matterId],
    queryFn: async () => {
      const res = await fetch(`/api/matters/${matterId}/timeline?view=${clientView ? 'client' : 'all'}`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    refetchInterval: clientView ? 30000 : false, // Auto-refresh for clients every 30s
  });

  const events: TimelineEvent[] = data?.events || [];

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "document_uploaded":
      case "document_signed":
        return <FileText className="w-4 h-4" />;
      case "payment_received":
        return <CreditCard className="w-4 h-4" />;
      case "court_date_set":
        return <Calendar className="w-4 h-4" />;
      case "message_sent":
        return <MessageCircle className="w-4 h-4" />;
      case "milestone_reached":
      case "task_completed":
        return <CheckCircle className="w-4 h-4" />;
      case "status_update":
        return <TrendingUp className="w-4 h-4" />;
      case "deadline_approaching":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "milestone_reached":
      case "task_completed":
      case "document_signed":
        return "text-green-600";
      case "payment_received":
        return "text-blue-600";
      case "deadline_approaching":
        return "text-yellow-600";
      case "court_date_set":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matter Timeline</CardTitle>
          <CardDescription>Activity history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matter Timeline</CardTitle>
          <CardDescription>Activity history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load timeline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Matter Timeline</CardTitle>
            <CardDescription>Real-time activity updates</CardDescription>
          </div>
          {clientView && (
            <Badge variant="outline" className="text-xs">
              Auto-refreshes every 30s
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground">
              Updates will appear here as work progresses
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
            
            {/* Events */}
            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-white",
                      getEventColor(event.eventType)
                    )}
                  >
                    {getEventIcon(event.eventType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(event.createdAt), "dd MMM yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>

                    {/* Metadata badges */}
                    {event.metadata && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {event.metadata.documentName && (
                          <Badge variant="outline" className="text-xs">
                            {event.metadata.documentName}
                          </Badge>
                        )}
                        {event.metadata.amount && (
                          <Badge variant="outline" className="text-xs">
                            £{event.metadata.amount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
