"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Clock,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";

interface NavRoute {
  name: string;
  href: string;
  icon: any;
  description?: string;
}

// PHASE 1: Simplified, focused navigation structure
const primaryRoutes: NavRoute[] = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    description: "Overview & analytics"
  },
  { 
    name: "Matters", 
    href: "/matters", 
    icon: Briefcase,
    description: "Active cases & projects"
  },
  { 
    name: "Clients", 
    href: "/clients", 
    icon: Users,
    description: "Client directory"
  },
  { 
    name: "Documents", 
    href: "/documents", 
    icon: FileText,
    description: "Files & attachments"
  },
  { 
    name: "Time & Billing", 
    href: "/time", 
    icon: Clock,
    description: "Time tracking & invoices"
  },
  { 
    name: "Deadlines", 
    href: "/deadlines", 
    icon: Calendar,
    description: "Court dates & tasks"
  },
  { 
    name: "Reports", 
    href: "/reports", 
    icon: BarChart3,
    description: "Analytics & insights"
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r bg-card lg:flex transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-5">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">L</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">LEXORA</h1>
              <p className="text-xs text-muted-foreground">Legal OS</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 transition-transform hover:bg-muted",
            collapsed && "mx-auto"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        {!collapsed ? (
          <nav className="space-y-1 px-3 py-4">
            {primaryRoutes.map((route) => {
              const Icon = route.icon;
              const active = pathname === route.href || pathname.startsWith(route.href + '/');
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-accent hover:shadow-sm",
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-200",
                    "group-hover:scale-110",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <div className="flex flex-col">
                    <span className={cn(
                      active && "font-semibold"
                    )}>{route.name}</span>
                    {route.description && !active && (
                      <span className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground">
                        {route.description}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="space-y-1 px-2 py-4">
            {primaryRoutes.map((route) => {
              const Icon = route.icon;
              const active = pathname === route.href || pathname.startsWith(route.href + '/');
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:shadow-sm",
                    active && "bg-primary text-primary-foreground shadow-md"
                  )}
                  title={route.name}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-3 py-4">
        {!collapsed ? (
          <div className="space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-full"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-full"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};
