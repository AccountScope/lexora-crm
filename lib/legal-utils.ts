/**
 * Legal-specific utility functions
 */

/**
 * Format currency in UK legal format (£)
 */
export function formatLegalCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date in UK legal format (DD/MM/YYYY)
 */
export function formatLegalDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

/**
 * Format date and time for legal documents
 */
export function formatLegalDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

/**
 * Generate matter reference number
 * Format: YYYY-AREA-NNNN (e.g., 2026-CORP-0001)
 */
export function generateMatterReference(
  year: number,
  practiceArea: string,
  sequence: number
): string {
  const areaCode = practiceArea.substring(0, 4).toUpperCase();
  const seqString = sequence.toString().padStart(4, '0');
  return `${year}-${areaCode}-${seqString}`;
}

/**
 * Format time entries in legal billing format (6-minute increments)
 */
export function formatBillableTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  // Round to nearest 6-minute increment (0.1 hour)
  const billableMinutes = Math.ceil(remainingMinutes / 6) * 6;
  const billableHours = hours + (billableMinutes / 60);
  
  return billableHours.toFixed(1);
}

/**
 * Legal status badge colors
 */
export const LEGAL_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'on-hold': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  archived: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
} as const;

/**
 * Practice area colors
 */
export const PRACTICE_AREA_COLORS = {
  corporate: 'bg-blue-100 text-blue-800',
  litigation: 'bg-red-100 text-red-800',
  'real-estate': 'bg-green-100 text-green-800',
  employment: 'bg-purple-100 text-purple-800',
  ip: 'bg-indigo-100 text-indigo-800',
  family: 'bg-pink-100 text-pink-800',
  criminal: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Trust account transaction types
 */
export const TRUST_TRANSACTION_TYPES = {
  deposit: 'Deposit to Trust',
  withdrawal: 'Withdrawal from Trust',
  transfer: 'Trust Transfer',
  interest: 'Interest Earned',
  fee: 'Legal Fee',
} as const;

/**
 * Format trust transaction type
 */
export function formatTrustTransactionType(type: keyof typeof TRUST_TRANSACTION_TYPES): string {
  return TRUST_TRANSACTION_TYPES[type] || type;
}

/**
 * Validate UK matter number format
 */
export function isValidMatterNumber(matterNumber: string): boolean {
  // Accepts: YYYY-AREA-NNNN or similar patterns
  const pattern = /^\d{4}-[A-Z]{2,6}-\d{4,6}$/;
  return pattern.test(matterNumber);
}

/**
 * Legal glossary terms with tooltips
 */
export const LEGAL_GLOSSARY = {
  'matter': 'A legal case or transaction being handled by the firm',
  'retainer': 'An advance payment to secure legal services',
  'disbursement': 'Expenses paid on behalf of a client (court fees, travel, etc.)',
  'billable-hours': 'Time spent working on client matters that can be charged',
  'utilization-rate': 'Percentage of working hours that are billable',
  'trust-account': 'Separate account holding client funds (solicitors\' regulated account)',
  'wip': 'Work in Progress - unbilled work completed for clients',
  'time-keeper': 'A lawyer or staff member who records billable time',
  'matter-number': 'Unique identifier assigned to each legal matter',
  'practice-area': 'Area of legal specialization (e.g., Corporate, Litigation)',
} as const;

/**
 * Get legal term tooltip
 */
export function getLegalTooltip(term: keyof typeof LEGAL_GLOSSARY): string {
  return LEGAL_GLOSSARY[term] || '';
}
