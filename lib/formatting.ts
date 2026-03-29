/**
 * Legal-specific formatting utilities for Lexora
 */

/**
 * Format currency in UK pound sterling
 * @example formatCurrency(1234.56) => "£1,234.56"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format date in UK legal standard (DD/MM/YYYY)
 * @example formatLegalDate("2026-03-29") => "29/03/2026"
 */
export function formatLegalDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

/**
 * Format date and time for legal documents
 * @example formatLegalDateTime("2026-03-29T10:30:00") => "29/03/2026 at 10:30"
 */
export function formatLegalDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d).replace(',', ' at')
}

/**
 * Format matter number with professional prefix
 * @example formatMatterNumber("12345") => "MAT-12345"
 */
export function formatMatterNumber(number: string | number, prefix: string = "MAT"): string {
  const num = typeof number === 'number' ? number.toString().padStart(5, '0') : number
  return `${prefix}-${num}`
}

/**
 * Format time duration in hours and minutes
 * @example formatTimeDuration(150) => "2h 30m"
 */
export function formatTimeDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format billable rate
 * @example formatBillableRate(250) => "£250/hr"
 */
export function formatBillableRate(rate: number): string {
  return `${formatCurrency(rate).replace('.00', '')}/hr`
}

/**
 * Format file size in human-readable format
 * @example formatFileSize(1536) => "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Truncate text with ellipsis
 * @example truncate("Very long text here", 10) => "Very long..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format percentage with precision
 * @example formatPercentage(0.1534, 1) => "15.3%"
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}
