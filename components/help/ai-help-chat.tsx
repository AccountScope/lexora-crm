"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, X, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface AIHelpChatProps {
  open: boolean
  onClose: () => void
}

/**
 * AI Help Chat Widget
 * Intelligent assistant for answering questions about Lexora
 */
export function AIHelpChat({ open, onClose }: AIHelpChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your Lexora AI assistant. I can help you with:\n\n• How to use features\n• Legal terminology\n• Best practices\n• Troubleshooting\n\nWhat would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "How do I reconcile trust accounts?",
        "What is chain of custody?",
        "How to create a new matter?",
        "Explain three-way reconciliation"
      ]
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // TODO: Replace with actual AI API call
      // For now, simulate with keyword-based responses
      const response = await simulateAIResponse(messageText)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("AI response error:", error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble right now. Please try:\n\n• Checking the help docs (⌘K)\n• Contacting support\n• Asking a different way",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-[400px] h-[600px] flex flex-col shadow-2xl rounded-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">Lexora AI Assistant</h3>
            <p className="text-xs opacity-80">Always here to help</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-background">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.suggestions && (
                  <div className="mt-3 space-y-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="block w-full text-left text-xs px-3 py-2 rounded bg-background hover:bg-accent transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI responses may not always be accurate
        </p>
      </div>
    </div>
  )
}

/**
 * Simulate AI responses (replace with actual AI API)
 */
async function simulateAIResponse(message: string): Promise<{
  content: string
  suggestions?: string[]
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  const lowerMessage = message.toLowerCase()

  // Keyword-based responses (replace with actual AI)
  if (lowerMessage.includes("trust account") || lowerMessage.includes("reconcil")) {
    return {
      content: "Trust accounting in Lexora follows SRA regulations:\n\n1. **Separation**: Client money must be kept separate from firm funds\n2. **Three-Way Reconciliation**: Monthly requirement to match:\n   • Bank statement balance\n   • Trust ledger balance\n   • Sum of client ledgers\n3. **Audit Trail**: Every transaction is logged\n\nWould you like to see a video tutorial on this?",
      suggestions: [
        "Show me the reconciliation page",
        "How do I create a trust account?",
        "What if the balances don't match?"
      ]
    }
  }

  if (lowerMessage.includes("chain of custody") || lowerMessage.includes("document")) {
    return {
      content: "Chain of custody tracks every interaction with a document:\n\n• **Who** uploaded it\n• **When** it was uploaded\n• **Who** accessed it\n• **What** changes were made\n• **Checksums** to verify integrity\n\nThis is required for court submissions and regulatory compliance. All documents in Lexora maintain this trail automatically.",
      suggestions: [
        "How do I upload documents?",
        "Can I see the access log?",
        "What file types are supported?"
      ]
    }
  }

  if (lowerMessage.includes("matter") || lowerMessage.includes("case")) {
    return {
      content: "To create a new matter:\n\n1. Click **'Cases'** in the sidebar\n2. Click **'Create Matter'**\n3. Fill in:\n   • Client details\n   • Matter type\n   • Practice area\n   • Lead attorney\n4. Click **Save**\n\nEverything (documents, time, trust funds) links to this matter automatically.",
      suggestions: [
        "How do I assign team members?",
        "Can I link emails to matters?",
        "How do I close a matter?"
      ]
    }
  }

  if (lowerMessage.includes("help") || lowerMessage.includes("stuck")) {
    return {
      content: "I'm here to help! Try:\n\n• **⌘K** for instant search\n• **Hover** info icons (ℹ️) for contextual help\n• **Video tutorials** in the help center\n• **Live chat** (9am-5pm UK time)\n• **Email** support@lexora.com\n\nWhat specific issue are you facing?",
      suggestions: [
        "Show me keyboard shortcuts",
        "Contact support",
        "Watch getting started video"
      ]
    }
  }

  // Default response
  return {
    content: "I can help with:\n\n• **Features**: How to use Lexora\n• **Legal terms**: SRA compliance, trust accounting, etc.\n• **Best practices**: Workflows and tips\n• **Troubleshooting**: Common issues\n\nCould you rephrase your question or try one of these?",
    suggestions: [
      "How do I reconcile trust accounts?",
      "What is chain of custody?",
      "How to track billable time?"
    ]
  }
}

/**
 * AI Chat Button - Floating button to open chat
 */
export function AIHelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          aria-label="AI Help"
        >
          <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}
      
      <AIHelpChat open={open} onClose={() => setOpen(false)} />
    </>
  )
}
