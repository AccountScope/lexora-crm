/**
 * Onboarding step definitions for different pages
 */

export const dashboardSteps = [
  {
    title: "Welcome to Lexora",
    description: "Your complete legal practice management platform. Let's take a quick tour of the key features to get you started."
  },
  {
    title: "Active Matters Dashboard",
    description: "Monitor all your cases from one place. Track status, deadlines, and recent activity without switching between multiple systems."
  },
  {
    title: "Trust Accounting",
    description: "SRA-compliant client money management with automatic three-way reconciliation. Keep client funds separate and properly tracked."
  },
  {
    title: "Document Vault",
    description: "Chain-of-custody protected document storage. Every upload, access, and modification is logged for court submissions and compliance."
  },
  {
    title: "Time Tracking",
    description: "Log billable hours directly against matters. Built-in timers, automatic calculations, and easy invoice generation."
  },
  {
    title: "You're All Set!",
    description: "These tooltips (ℹ️ icons) are everywhere to help you. Hover over any info icon to learn more about features as you explore."
  }
]

export const trustAccountingSteps = [
  {
    title: "Trust Accounting Overview",
    description: "SRA regulations require solicitors to keep client money separate from firm funds. Lexora automates compliance and reconciliation."
  },
  {
    title: "Three-Way Reconciliation",
    description: "Monthly requirement: bank statement balance = trust ledger = sum of client ledgers. Lexora does this automatically."
  },
  {
    title: "Client Ledgers",
    description: "Each client gets their own ledger within your trust account. Track deposits, withdrawals, and balances per client."
  },
  {
    title: "Compliance Reports",
    description: "Export reconciliation reports for SRA audits. All transactions are timestamped and immutable for regulatory compliance."
  }
]

export const documentVaultSteps = [
  {
    title: "Chain of Custody",
    description: "Every document maintains a complete audit trail - who uploaded it, when, who accessed it, and any modifications made."
  },
  {
    title: "Classification System",
    description: "Documents are automatically classified (Confidential, Privileged, etc.) to ensure proper handling and access control."
  },
  {
    title: "Court Submission Ready",
    description: "All documents include metadata required for court submissions - timestamps, checksums, and access logs."
  },
  {
    title: "Version Control",
    description: "Lexora tracks every version of every document. Roll back changes, see who edited what, and maintain document history."
  }
]

export const caseManagementSteps = [
  {
    title: "Matter-Centric Workflow",
    description: "Everything in Lexora connects to matters - documents, time entries, emails, trust transactions, and deadlines."
  },
  {
    title: "Status Tracking",
    description: "Track matters through their lifecycle: Open → In Progress → Pending → Closed. Custom statuses for your workflow."
  },
  {
    title: "Team Collaboration",
    description: "Assign lead attorneys, support staff, and permissions per matter. Everyone sees what they need, nothing they don't."
  },
  {
    title: "Deadline Management",
    description: "Automatic reminders for critical dates. Never miss a filing deadline or court appearance again."
  }
]

export const timeTrackingSteps = [
  {
    title: "Billable Time Tracking",
    description: "Log time directly against matters with built-in timers. Lexora calculates billable amounts automatically."
  },
  {
    title: "Hourly Rates",
    description: "Set rates per attorney or matter type. Rates are applied automatically when logging time."
  },
  {
    title: "Invoice Generation",
    description: "Convert tracked time into professional invoices with one click. Export to PDF or send directly to clients."
  },
  {
    title: "Write-Offs & Adjustments",
    description: "Mark time as non-billable, apply discounts, or write off hours with full audit trail."
  }
]

/**
 * Check if user should see onboarding for a specific page
 */
export function shouldShowOnboarding(key: string): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(`lexora-onboarding-${key}`)
}

/**
 * Mark onboarding as completed for a specific page
 */
export function completeOnboarding(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`lexora-onboarding-${key}`, 'true')
}

/**
 * Reset all onboarding (for testing or help)
 */
export function resetAllOnboarding(): void {
  if (typeof window === 'undefined') return
  const keys = [
    'dashboard',
    'trust-accounting',
    'document-vault',
    'case-management',
    'time-tracking'
  ]
  keys.forEach(key => {
    localStorage.removeItem(`lexora-onboarding-${key}`)
  })
}
