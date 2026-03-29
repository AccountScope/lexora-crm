"use client";

import { useState } from "react";
import { Plus, Briefcase, Clock, FileText, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Briefcase,
      label: "New Case",
      href: "/cases/new",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      icon: Clock,
      label: "Log Time",
      href: "/time",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      icon: FileText,
      label: "Upload Doc",
      href: "/documents",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      icon: DollarSign,
      label: "New Invoice",
      href: "/invoices/new",
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Action Buttons */}
      {isOpen && (
        <>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`group flex items-center gap-3 ${action.color} text-white rounded-full shadow-lg px-4 py-3 transition-all hover:scale-105 animate-in slide-in-from-bottom-2`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </>
      )}

      {/* Main FAB Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-xl transition-all ${
          isOpen ? "rotate-45 bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
        }`}
        size="icon"
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
