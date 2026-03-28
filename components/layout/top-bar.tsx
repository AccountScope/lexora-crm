"use client";

import { Shield } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlobalSearch } from "@/components/search/global-search";

export const TopBar = () => {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-primary" />
        Enterprise legal CRM
      </div>
      <div className="flex flex-1 items-center gap-3 px-6">
        <div className="flex-1">
          <GlobalSearch />
        </div>
        <ThemeToggle />
        <NotificationBell />
        <Avatar className="h-9 w-9 border">
          <AvatarFallback>HJ</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
