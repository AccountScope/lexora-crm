"use client";

import { Bell, Search, Settings, User, LogOut, HelpCircle, Shield, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/search/global-search";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export const TopBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get page title from pathname
  const getPageTitle = () => {
    const paths: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/matters': 'Matters',
      '/clients': 'Clients',
      '/calendar': 'Calendar',
      '/time': 'Time Tracking',
      '/billing': 'Billing',
      '/trust': 'Trust Accounting',
      '/reports': 'Reports',
      '/documents': 'Documents',
      '/conflicts': 'Conflicts',
      '/compliance': 'Compliance',
      '/emails': 'Emails',
      '/messaging': 'Messages',
      '/settings': 'Settings',
    };
    
    for (const [path, title] of Object.entries(paths)) {
      if (pathname.startsWith(path)) return title;
    }
    return 'LEXORA';
  };

  const handleSignOut = () => {
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title / Breadcrumb */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {getPageTitle()}
          </h2>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden flex-1 md:flex md:justify-center md:px-6">
          <div className="w-full max-w-md">
            <GlobalSearch />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {/* SRA Compliance Badge */}
          <div className="hidden items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success lg:flex">
            <Shield className="h-3 w-3" />
            SRA Compliant
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatars/default.png" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    SJ
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Sabrina Johnson</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    sabrina@test.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="border-t px-6 py-3 md:hidden">
        <GlobalSearch />
      </div>
    </header>
  );
};
