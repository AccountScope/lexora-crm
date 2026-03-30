"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Files,
  Users,
  ShieldCheck,
  MessageSquare,
  LayoutGrid,
  Clock3,
  ReceiptText,
  Scale,
  Mail,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Gavel,
  PiggyBank,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

interface NavRoute {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "destructive";
}

const mainRoutes: NavRoute[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Matters", href: "/matters", icon: Briefcase, badge: "47" },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Calendar", href: "/calendar", icon: Calendar, badge: "3", badgeVariant: "warning" },
  { name: "Time Tracking", href: "/time", icon: Clock3 },
];

const financialRoutes: NavRoute[] = [
  { name: "Billing", href: "/billing", icon: ReceiptText },
  { name: "Trust Accounting", href: "/trust", icon: PiggyBank, badge: "!", badgeVariant: "destructive" },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

const legalRoutes: NavRoute[] = [
  { name: "Documents", href: "/documents", icon: Files },
  { name: "Conflicts", href: "/conflicts", icon: Scale },
  { name: "Compliance", href: "/compliance", icon: ShieldCheck },
  { name: "Court Rules", href: "/court-rules", icon: Gavel },
];

const communicationRoutes: NavRoute[] = [
  { name: "Emails", href: "/emails", icon: Mail, badge: "12" },
  { name: "Messages", href: "/messaging", icon: MessageSquare, badge: "5", badgeVariant: "success" },
];

const bottomRoutes: NavRoute[] = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
];

interface NavSectionProps {
  title: string;
  routes: NavRoute[];
  pathname: string;
}

function NavSection({ title, routes, pathname }: NavSectionProps) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {routes.map((route) => {
        const Icon = route.icon;
        const active = pathname === route.href || pathname.startsWith(route.href + '/');
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                active && "text-primary"
              )} />
              <span>{route.name}</span>
            </div>
            {route.badge && (
              <Badge 
                variant={route.badgeVariant || "default"}
                className="h-5 min-w-[20px] px-1.5 text-xs font-semibold"
              >
                {route.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "hidden h-screen flex-col border-r bg-card lg:flex transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-5">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold tracking-tight">LEXORA</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Legal CRM</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", collapsed && "mx-auto")}
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
      {!collapsed ? (
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-6">
            <NavSection title="Main" routes={mainRoutes} pathname={pathname} />
            <NavSection title="Financial" routes={financialRoutes} pathname={pathname} />
            <NavSection title="Legal" routes={legalRoutes} pathname={pathname} />
            <NavSection title="Communication" routes={communicationRoutes} pathname={pathname} />
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1 px-2 py-6">
          <div className="space-y-2">
            {[...mainRoutes, ...financialRoutes, ...legalRoutes, ...communicationRoutes].map((route) => {
              const Icon = route.icon;
              const active = pathname === route.href || pathname.startsWith(route.href + '/');
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "relative flex h-12 w-full items-center justify-center rounded-lg transition-all hover:bg-muted",
                    active && "bg-primary/10 text-primary"
                  )}
                  title={route.name}
                >
                  <Icon className="h-5 w-5" />
                  {route.badge && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="border-t px-4 py-4">
        {!collapsed ? (
          <div className="space-y-2">
            {bottomRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-5 w-5" />
                  {route.name}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
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

      {/* Deployment Mode Badge */}
      {!collapsed && (
        <div className="border-t px-6 py-3">
          <Badge variant="outline" className="w-full justify-center text-xs">
            {process.env.NEXT_PUBLIC_DEPLOYMENT_MODE ?? "Supabase"}
          </Badge>
        </div>
      )}
    </aside>
  );
};
