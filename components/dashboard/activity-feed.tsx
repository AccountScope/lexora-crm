"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  MessageSquare, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Users,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "matter" | "time" | "message" | "invoice" | "deadline" | "completion";
  title: string;
  description?: string;
  timestamp: Date;
  user?: string;
  matter?: string;
}

interface ActivityFeedProps {
  activities?: Activity[];
  loading?: boolean;
}

// Mock data
const mockActivities: Activity[] = [
  {
    id: "1",
    type: "matter",
    title: "New matter created",
    description: "Smith vs. Johnson - Employment Dispute",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: "Sarah Mitchell",
  },
  {
    id: "2",
    type: "time",
    title: "Time logged",
    description: "3.5 hours - Client consultation",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: "James Wilson",
    matter: "Acme Corp Acquisition",
  },
  {
    id: "3",
    type: "invoice",
    title: "Invoice generated",
    description: "£8,500.00 - October billing",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    matter: "Thompson Estate",
  },
  {
    id: "4",
    type: "deadline",
    title: "Upcoming deadline",
    description: "Court filing due in 2 days",
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    matter: "R v. Anderson",
  },
  {
    id: "5",
    type: "completion",
    title: "Matter completed",
    description: "Property Purchase - Williams Family",
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    user: "David Chen",
  },
];

const activityIcons = {
  matter: FileText,
  time: Clock,
  message: MessageSquare,
  invoice: DollarSign,
  deadline: AlertCircle,
  completion: CheckCircle2,
};

const activityColors = {
  matter: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  time: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  message: "text-green-600 bg-green-50 dark:bg-green-900/20",
  invoice: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  deadline: "text-red-600 bg-red-50 dark:bg-red-900/20",
  completion: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
};

export function ActivityFeed({ activities = mockActivities, loading = false }: ActivityFeedProps) {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>
          Latest updates across your matters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.type];
                return (
                  <div 
                    key={activity.id} 
                    className="flex gap-4 pb-4 border-b last:border-0 last:pb-0 transition-all hover:bg-muted/30 -mx-2 px-2 py-2 rounded-md"
                  >
                    <div 
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activityColors[activity.type]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        {activity.user && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {activity.user}
                          </Badge>
                        )}
                        {activity.matter && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="mr-1 h-3 w-3" />
                            {activity.matter}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
