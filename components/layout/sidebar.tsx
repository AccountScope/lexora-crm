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
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavRoute {
  name: string;
  href: string;
  icon: any;
  description?: string;
}

// PHASE 1: Simplified, premium navigation structure
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
    description: "Active cases"
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
    description: "Files & records"
  },
  { 
    name: "Time & Billing", 
    href: "/time", 
    icon: Clock,
    description: "Track & invoice"
  },
  { 
    name: "Deadlines", 
    href: "/calendar", 
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

// Removed NavSection - using flat navigation for clarity

export const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r bg-card lg:flex transition-all duration-300 ease-in-out shadow-sm",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-6 py-5">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <span className="text-sm font-bold text-primary-foreground">L</span>
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
            "h-8 w-8 shrink-0 rounded-md transition-all hover:bg-accent hover:scale-105",
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
                    "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                    "hover:bg-accent/50 hover:shadow-sm hover:translate-x-0.5",
                    active
                      ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-200",
                    "group-hover:scale-110",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={cn(
                      "truncate",
                      active && "font-semibold"
                    )}>{route.name}</span>
                    {route.description && !active && (
                      <span className="text-xs text-muted-foreground/60 truncate group-hover:text-muted-foreground transition-colors">
                        {route.description}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="space-y-2 px-2 py-4">
            {primaryRoutes.map((route) => {
              const Icon = route.icon;
              const active = pathname === route.href || pathname.startsWith(route.href + '/');
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-lg transition-all duration-200",
                    "hover:bg-accent/50 hover:shadow-sm hover:scale-105",
                    active && "bg-primary text-primary-foreground shadow-md scale-105"
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
      <div className="border-t bg-card/50 backdrop-blur-sm px-3 py-4">
        {!collapsed ? (
          <div className="space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent/50 hover:text-foreground hover:shadow-sm"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-full hover:bg-accent/50 hover:scale-105 transition-all"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-full hover:bg-accent/50 hover:scale-105 transition-all"
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
