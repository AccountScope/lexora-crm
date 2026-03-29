/**
 * Interactive tour steps with element targeting
 */

import { TourStep } from "@/components/onboarding/interactive-tour"

export const dashboardInteractiveTour: TourStep[] = [
  {
    title: "Welcome to Lexora",
    description: "Your complete legal practice management platform. Let's explore the key features with an interactive tour.",
    target: "body",
    position: "center",
    action: "none"
  },
  {
    title: "Active Matters Overview",
    description: "This card shows your total active legal matters. Hover over the info icon to learn what counts as 'active'.",
    target: '[data-tour="active-matters"]',
    position: "bottom",
    action: "hover",
    highlightPadding: 12
  },
  {
    title: "Quick Actions",
    description: "Use these buttons to quickly create new matters, log time, or upload documents.",
    target: '[data-tour="quick-actions"]',
    position: "left",
    action: "none"
  },
  {
    title: "Recent Activity Feed",
    description: "Stay updated with the latest changes across all your matters and cases.",
    target: '[data-tour="recent-activity"]',
    position: "top",
    action: "none"
  },
  {
    title: "Navigation Sidebar",
    description: "Access all major features from here: Cases, Trust Accounting, Documents, Reports, and more.",
    target: '[data-tour="sidebar-nav"]',
    position: "right",
    action: "none",
    highlightPadding: 16
  },
  {
    title: "You're All Set!",
    description: "Look for info icons (ℹ️) throughout the app for contextual help. Click 'Finish' to start using Lexora.",
    target: "body",
    position: "center",
    action: "none"
  }
]

export const trustAccountingInteractiveTour: TourStep[] = [
  {
    title: "Trust Accounting Overview",
    description: "SRA-compliant client money management. Let's explore the key features.",
    target: "body",
    position: "center",
    action: "none"
  },
  {
    title: "Create Trust Account",
    description: "Click this button to add your first trust account. You'll need bank details and account type.",
    target: '[data-tour="create-trust-account"]',
    position: "bottom",
    action: "click",
    allowInteraction: true
  },
  {
    title: "Three-Way Reconciliation",
    description: "Monthly SRA requirement. Lexora automates this by comparing bank statement, trust ledger, and client ledgers.",
    target: '[data-tour="reconciliation-link"]',
    position: "right",
    action: "none"
  },
  {
    title: "Trust Account Summary",
    description: "Total funds across all trust accounts. Must match the sum of all client ledgers.",
    target: '[data-tour="trust-summary"]',
    position: "top",
    action: "none"
  }
]

export const documentVaultInteractiveTour: TourStep[] = [
  {
    title: "Secure Document Vault",
    description: "Chain-of-custody protected document storage for court submissions and compliance.",
    target: "body",
    position: "center",
    action: "none"
  },
  {
    title: "Upload Documents",
    description: "Drag and drop files here or click to browse. All uploads are automatically logged.",
    target: '[data-tour="upload-zone"]',
    position: "bottom",
    action: "none",
    highlightPadding: 16
  },
  {
    title: "Document Classification",
    description: "Files are automatically classified (Confidential, Privileged, etc.) for proper handling.",
    target: '[data-tour="document-table"]',
    position: "top",
    action: "none"
  },
  {
    title: "Chain of Custody",
    description: "Click the info icon to learn how Lexora tracks every document access and modification.",
    target: '[data-tour="chain-of-custody-info"]',
    position: "left",
    action: "hover"
  }
]

export const caseManagementInteractiveTour: TourStep[] = [
  {
    title: "Matter Management",
    description: "Track cases, clients, and legal work from one central dashboard.",
    target: "body",
    position: "center",
    action: "none"
  },
  {
    title: "Create New Matter",
    description: "Click here to start a new legal matter. You'll need client info, practice area, and matter type.",
    target: '[data-tour="create-matter"]',
    position: "bottom",
    action: "click",
    allowInteraction: true
  },
  {
    title: "Matter Status Badges",
    description: "Hover over status badges to see what each status means (Open, Pending, On Hold, Closed).",
    target: '[data-tour="status-badge"]',
    position: "right",
    action: "hover"
  },
  {
    title: "Filter and Search",
    description: "Quickly find matters by status, practice area, or client name.",
    target: '[data-tour="case-filters"]',
    position: "left",
    action: "none"
  }
]

export const timeTrackingInteractiveTour: TourStep[] = [
  {
    title: "Time Tracking & Billing",
    description: "Log billable hours and generate invoices seamlessly.",
    target: "body",
    position: "center",
    action: "none"
  },
  {
    title: "Start Timer",
    description: "Click to start tracking time. Select a matter and describe the work.",
    target: '[data-tour="start-timer"]',
    position: "bottom",
    action: "click",
    allowInteraction: true
  },
  {
    title: "Time Entries Log",
    description: "View all logged time here. Edit, delete, or mark as non-billable.",
    target: '[data-tour="time-entries"]',
    position: "top",
    action: "none"
  },
  {
    title: "Generate Invoice",
    description: "Convert tracked time into professional invoices with one click.",
    target: '[data-tour="generate-invoice"]',
    position: "right",
    action: "none"
  }
]

/**
 * Get interactive tour for a specific page
 */
export function getInteractiveTour(page: string): TourStep[] | null {
  const tours: Record<string, TourStep[]> = {
    dashboard: dashboardInteractiveTour,
    'trust-accounting': trustAccountingInteractiveTour,
    'document-vault': documentVaultInteractiveTour,
    'case-management': caseManagementInteractiveTour,
    'time-tracking': timeTrackingInteractiveTour
  }
  
  return tours[page] || null
}
