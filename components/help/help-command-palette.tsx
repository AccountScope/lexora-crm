"use client"

import { useState, useEffect, useCallback } from "react"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { HelpCircle, BookOpen, Video, MessageCircle, Search, ExternalLink } from "lucide-react"
import { legalGlossary } from "@/lib/legal-glossary"

interface HelpItem {
  id: string
  title: string
  description: string
  category: "guide" | "glossary" | "video" | "support"
  url?: string
  action?: () => void
}

/**
 * Help Command Palette - Press ⌘K or Ctrl+K to search help
 */
export function HelpCommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Listen for ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Build help items from glossary
  const helpItems: HelpItem[] = [
    // Guides
    {
      id: "guide-getting-started",
      title: "Getting Started with Lexora",
      description: "Learn the basics of setting up your legal practice",
      category: "guide",
      url: "/docs/getting-started"
    },
    {
      id: "guide-trust-accounting",
      title: "Trust Accounting Setup",
      description: "How to set up SRA-compliant trust accounts",
      category: "guide",
      url: "/docs/trust-accounting"
    },
    {
      id: "guide-three-way-recon",
      title: "Three-Way Reconciliation",
      description: "Complete guide to monthly reconciliation requirements",
      category: "guide",
      url: "/docs/reconciliation"
    },
    {
      id: "guide-document-vault",
      title: "Document Management",
      description: "Upload, organize, and track legal documents",
      category: "guide",
      url: "/docs/documents"
    },
    {
      id: "guide-time-tracking",
      title: "Time Tracking & Billing",
      description: "Log billable hours and generate invoices",
      category: "guide",
      url: "/docs/time-tracking"
    },
    
    // Glossary terms
    ...Object.entries(legalGlossary).map(([term, definition]) => ({
      id: `glossary-${term}`,
      title: term.replace(/([A-Z])/g, ' $1').trim(),
      description: definition,
      category: "glossary" as const
    })),

    // Video tutorials (placeholder)
    {
      id: "video-overview",
      title: "Lexora Platform Overview",
      description: "5-minute video walkthrough of key features",
      category: "video",
      url: "/docs/videos/overview"
    },
    {
      id: "video-trust-accounting",
      title: "Trust Accounting Demo",
      description: "Watch how to manage client funds",
      category: "video",
      url: "/docs/videos/trust-accounting"
    },

    // Support
    {
      id: "support-contact",
      title: "Contact Support",
      description: "Get help from our team",
      category: "support",
      action: () => {
        window.location.href = "mailto:support@lexora.com"
      }
    },
    {
      id: "support-chat",
      title: "Live Chat",
      description: "Chat with support (9am-5pm UK time)",
      category: "support",
      action: () => {
        // Open chat widget
        alert("Chat widget would open here")
      }
    }
  ]

  const filteredItems = search
    ? helpItems.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      )
    : helpItems.slice(0, 10) // Show top 10 when no search

  const categoryIcons = {
    guide: <BookOpen className="h-4 w-4" />,
    glossary: <HelpCircle className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    support: <MessageCircle className="h-4 w-4" />
  }

  const categoryLabels = {
    guide: "Guides",
    glossary: "Glossary",
    video: "Video Tutorials",
    support: "Support"
  }

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, HelpItem[]>)

  const handleSelect = (item: HelpItem) => {
    if (item.action) {
      item.action()
    } else if (item.url) {
      window.open(item.url, "_blank")
    }
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search help, guides, and glossary..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No help articles found.</CommandEmpty>
        
        {Object.entries(groupedItems).map(([category, items]) => (
          <CommandGroup
            key={category}
            heading={categoryLabels[category as keyof typeof categoryLabels]}
          >
            {items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(item)}
                className="flex items-start gap-3 py-3"
              >
                <div className="mt-0.5">
                  {categoryIcons[item.category]}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </div>
                </div>
                {item.url && (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      
      <div className="border-t p-2 text-xs text-muted-foreground text-center">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘K</kbd> or{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+K</kbd> to toggle
      </div>
    </CommandDialog>
  )
}

/**
 * Help Button - Trigger help palette from anywhere
 */
export function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Help"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
      <HelpCommandPalette />
    </>
  )
}
