/**
 * Legal terminology glossary for contextual tooltips
 * Use these definitions in tooltips throughout the app
 */

export const legalGlossary = {
  // Matter Management
  matter: "A legal case or client engagement handled by your firm",
  matterNumber: "Unique identifier assigned to each legal matter for tracking and billing",
  practiceArea: "The legal specialty or department (e.g., Family Law, Corporate, Litigation)",
  leadAttorney: "The solicitor or barrister primarily responsible for a matter",
  
  // Trust Accounting
  trustAccount: "Client money account held separately from operating funds (SRA-regulated)",
  clientLedger: "Individual record of funds held for a specific client in trust",
  threeWayReconciliation: "Required monthly check: bank statement, client ledger, and trust ledger must match",
  officeLedger: "Firm's own money account used for expenses and fee income",
  
  // Billing & Time
  billableTime: "Time spent on client work that can be invoiced",
  nonBillable: "Time spent on internal tasks or pro bono work (not charged to client)",
  writeOff: "Billable time that will not be charged to the client",
  hourlyRate: "Fee charged per hour of legal work",
  
  // Case Status
  open: "Matter is active with ongoing work",
  pending: "Awaiting external action (client response, court date, etc.)",
  onHold: "Temporarily paused - no active work scheduled",
  closed: "Matter completed and archived",
  
  // Documents
  chainOfCustody: "Documented record of who accessed/modified a file and when",
  privileged: "Protected by legal professional privilege - confidential",
  workProduct: "Documents prepared by lawyers in anticipation of litigation",
  
  // Conflicts
  conflictCheck: "Process to ensure no competing interests between clients",
  adverseParty: "Opposing party in a legal dispute",
  conflictWaiver: "Client consent to proceed despite potential conflict",
  
  // Compliance
  sra: "Solicitors Regulation Authority - regulates solicitors in England and Wales",
  gdpr: "General Data Protection Regulation - EU privacy law",
  aml: "Anti-Money Laundering regulations - client identity verification required",
  cpd: "Continuing Professional Development - required training for solicitors",
  
  // Financial
  disbursement: "Out-of-pocket expenses paid on behalf of client (court fees, expert fees)",
  retainer: "Upfront payment held in trust before work begins",
  contingency: "Fee arrangement where payment depends on case outcome (no win, no fee)",
  
  // Court & Procedure
  pleading: "Formal written statements filed with the court",
  discovery: "Process of exchanging evidence between parties",
  deposition: "Out-of-court testimony given under oath",
  settlement: "Agreement to resolve dispute without trial",
  
  // Client Portal
  clientPortal: "Secure online area where clients can view case updates and documents",
  secureMessaging: "Encrypted communication between lawyer and client",
  
  // Reports
  wip: "Work in Progress - unbilled time and expenses",
  ar: "Accounts Receivable - invoices awaiting payment",
  agingReport: "Shows how long invoices have been outstanding",
  
  // Team & Permissions
  role: "Set of permissions controlling what a team member can access",
  principalSolicitor: "Senior lawyer with full supervisory responsibility",
  paralegal: "Legal assistant who supports solicitors but cannot give legal advice",
  
  // Security
  twoFactor: "Extra security layer requiring a code from your phone in addition to password",
  sessionTimeout: "Automatic logout after period of inactivity",
  auditLog: "Record of all actions taken in the system for compliance"
} as const

/**
 * Get tooltip text for a legal term
 * @example getTooltip('matter') => "A legal case or client engagement..."
 */
export function getTooltip(term: keyof typeof legalGlossary): string {
  return legalGlossary[term]
}

/**
 * Check if a term has a glossary entry
 */
export function hasTooltip(term: string): term is keyof typeof legalGlossary {
  return term in legalGlossary
}

/**
 * Get all glossary terms (useful for autocomplete/search)
 */
export function getAllTerms(): Array<keyof typeof legalGlossary> {
  return Object.keys(legalGlossary) as Array<keyof typeof legalGlossary>
}
