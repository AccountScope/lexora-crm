"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTooltip, hasTooltip, legalGlossary } from "@/lib/legal-glossary"
import { HelpCircle } from "lucide-react"

interface LegalTermProps {
  term: keyof typeof legalGlossary
  children?: React.ReactNode
  showIcon?: boolean
  asChild?: boolean
}

/**
 * Wrap legal terminology with automatic tooltip
 * 
 * @example
 * <LegalTerm term="trustAccount">Trust Account</LegalTerm>
 * // Renders "Trust Account" with a tooltip explaining what it means
 * 
 * @example
 * <LegalTerm term="matter" showIcon>Matter</LegalTerm>
 * // Renders "Matter" with a help icon
 */
export function LegalTerm({ term, children, showIcon = false, asChild = false }: LegalTermProps) {
  const tooltipText = getTooltip(term)
  const displayText = children || term

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild={asChild}>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/50">
            {displayText}
            {showIcon && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Automatically wrap common legal terms in tooltips
 * 
 * @example
 * <AutoTooltip>
 *   Create a new matter to track your case
 * </AutoTooltip>
 * // Automatically wraps "matter" with a tooltip
 */
export function AutoTooltip({ children }: { children: string }) {
  if (!children) return null

  // Split text by words
  const words = children.split(' ')
  
  return (
    <>
      {words.map((word, idx) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '')
        
        if (hasTooltip(cleanWord)) {
          return (
            <span key={idx}>
              <LegalTerm term={cleanWord as keyof typeof legalGlossary}>
                {word}
              </LegalTerm>
              {' '}
            </span>
          )
        }
        
        return <span key={idx}>{word} </span>
      })}
    </>
  )
}
