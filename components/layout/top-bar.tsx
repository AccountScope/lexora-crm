"use client";

import { Bell, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const TopBar = () => {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-primary" />
        Enterprise legal CRM
      </div>
      <div className="flex flex-1 items-center gap-3 px-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search cases, documents, or clients" />
        </div>
        <ThemeToggle />
        <button className="relative rounded-full border p-2 text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        <Avatar className="h-9 w-9 border">
          <AvatarFallback>HJ</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
