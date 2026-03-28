"use client";

import Link from "next/link";
import { Bell, CheckCheck, Loader2, Mail, Undo2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useMarkNotification } from "@/lib/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";

export const NotificationBell = () => {
  const { data, isLoading } = useNotifications({ limit: 15 });
  const markMutation = useMarkNotification();
  const unreadCount = data?.meta.unreadCount ?? 0;
  const notifications = data?.data ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative" size="icon" variant="ghost">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div>
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">Stay ahead of every deadline</p>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <ScrollArea className="h-80">
          <div className="divide-y">
            {notifications.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Nothing new right now.</div>
            )}
            {notifications.map((notification) => {
              const isUnread = !notification.readAt;
              const href = notification.url ?? (notification.relatedCaseId ? `/cases/${notification.relatedCaseId}` : undefined);
              return (
                <div key={notification.id} className="flex gap-3 p-4">
                  <div className="mt-1">
                    {notification.type === "DEADLINE_REMINDER" ? (
                      <Mail className="h-4 w-4 text-primary" />
                    ) : (
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-tight">{notification.title}</p>
                      {notification.priority && (
                        <Badge variant={notification.priority === "HIGH" ? "warning" : "secondary"}>{notification.priority}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                    <div className="flex gap-2 text-xs">
                      {href && (
                        <Link className="text-primary hover:underline" href={href}>
                          Open
                        </Link>
                      )}
                      <button
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                        disabled={markMutation.isPending}
                        onClick={() => markMutation.mutate({ notificationId: notification.id, read: isUnread })}
                        type="button"
                      >
                        {isUnread ? (
                          <>
                            <CheckCheck className="h-3 w-3" /> Mark read
                          </>
                        ) : (
                          <>
                            <Undo2 className="h-3 w-3" /> Mark unread
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
