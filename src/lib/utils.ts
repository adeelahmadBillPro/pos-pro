import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateOrderNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${date}-${rand}`
}

export function generateReturnNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `RTN-${date}-${rand}`
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateSKU(name: string): string {
  const prefix = name
    .split(' ')
    .map(w => w.slice(0, 3).toUpperCase())
    .join('-')
  const rand = Math.floor(100 + Math.random() * 900)
  return `${prefix}-${rand}`
}

export function formatCurrency(amount: number, currency = 'PKR'): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+92${cleaned.slice(1)}`
  }
  return phone
}

export function calcLoyaltyPoints(orderTotal: number): number {
  return Math.floor(orderTotal / 100)
}

export function getDaysRemaining(endDate: Date | string): number {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function truncate(str: string, len = 50): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
