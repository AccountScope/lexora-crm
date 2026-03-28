"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
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
} from "lucide-react";

const routes = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid },
  { name: "Cases", href: "/cases", icon: Briefcase },
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Document Vault", href: "/documents", icon: Files },
  { name: "Time tracking", href: "/time", icon: Clock3 },
  { name: "Billing", href: "/billing", icon: ReceiptText },
  { name: "Conflicts", href: "/conflicts", icon: Scale },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Compliance", href: "/compliance", icon: ShieldCheck },
  { name: "Messaging", href: "/messaging", icon: MessageSquare },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <div className="px-6 py-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Lexora</div>
        <p className="text-xl font-semibold">Control Center</p>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {routes.map((route) => {
          const Icon = route.icon;
          const active = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {route.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-6 py-4 text-xs text-muted-foreground">
        Mode: {process.env.NEXT_PUBLIC_DEPLOYMENT_MODE ?? "supabase"}
      </div>
    </aside>
  );
};
